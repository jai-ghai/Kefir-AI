mod audio;
mod streaming;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

// ── State ─────────────────────────────────────────────────────────────────────

enum AsrMode {
    /// Local faster-whisper: record to WAV, process after stop.
    Local { wav_dir: PathBuf },
    /// Deepgram streaming: transcripts arrive live, nothing to do on stop.
    Streaming,
}

pub struct RecState {
    stop:          Arc<AtomicBool>,
    /// Handles for std threads (mic + loopback audio capture).
    handles:       Mutex<Vec<std::thread::JoinHandle<anyhow::Result<()>>>>,
    /// Handles for tokio tasks (Deepgram WS streams).
    stream_tasks:  Mutex<Vec<tokio::task::JoinHandle<()>>>,
    asr_mode:      Mutex<Option<AsrMode>>,
}

impl Default for RecState {
    fn default() -> Self {
        Self {
            stop:         Arc::new(AtomicBool::new(false)),
            handles:      Mutex::new(vec![]),
            stream_tasks: Mutex::new(vec![]),
            asr_mode:     Mutex::new(None),
        }
    }
}

// ── Shared event types ────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
struct StatusEvent {
    phase:   String,
    message: String,
}

#[derive(Serialize, Clone)]
struct TranscriptEntry {
    id:            String,
    speaker:       String,
    #[serde(rename = "speakerLabel")]
    speaker_label: Option<String>,
    text:          String,
    timestamp:     String,
    start:         f64,
    end:           f64,
}

// ── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
async fn start_recording(
    app: AppHandle,
    state: State<'_, RecState>,
    asr_provider: String,   // "local" | "deepgram"
    deepgram_key: String,
) -> Result<(), String> {
    state.stop.store(false, Ordering::Relaxed);

    if asr_provider == "deepgram" && !deepgram_key.is_empty() {
        start_deepgram_mode(&app, &state, deepgram_key).await?;
    } else {
        start_local_mode(&app, &state).await?;
    }

    emit_status(&app, "recording", "Recording...");
    Ok(())
}

async fn start_deepgram_mode(
    app: &AppHandle,
    state: &State<'_, RecState>,
    api_key: String,
) -> Result<(), String> {
    // Query device formats first so Deepgram WebSocket URLs are correct.
    let (mic_rate, mic_ch)   = audio::query_input_format().map_err(|e| e.to_string())?;
    let (loop_rate, loop_ch) = audio::query_loopback_format().map_err(|e| e.to_string())?;

    // Spawn Deepgram WS tasks — returns audio byte senders immediately (no await).
    let (mic_audio_tx, dg_mic) = streaming::spawn_deepgram(
        app.clone(), api_key.clone(), mic_rate, mic_ch, "ME",
    );
    let (loop_audio_tx, dg_loop) = streaming::spawn_deepgram(
        app.clone(), api_key, loop_rate, loop_ch, "THEM",
    );

    // Start audio capture threads, piping bytes directly to Deepgram senders.
    let (h_mic, _, _) = audio::start_mic_streaming(Arc::clone(&state.stop), mic_audio_tx)
        .map_err(|e| e.to_string())?;
    let (h_loop, _, _) = audio::start_loopback_streaming(Arc::clone(&state.stop), loop_audio_tx)
        .map_err(|e| e.to_string())?;

    state.handles.lock().unwrap().extend([h_mic, h_loop]);
    state.stream_tasks.lock().unwrap().extend([dg_mic, dg_loop]);
    *state.asr_mode.lock().unwrap() = Some(AsrMode::Streaming);

    Ok(())
}

async fn start_local_mode(
    _app: &AppHandle,
    state: &State<'_, RecState>,
) -> Result<(), String> {
    let dir = tempfile::tempdir()
        .map_err(|e| e.to_string())?
        .keep();

    let mic_path      = dir.join("me_stream.wav");
    let loopback_path = dir.join("them_stream.wav");

    let stop_mic  = Arc::clone(&state.stop);
    let stop_loop = Arc::clone(&state.stop);

    let h_mic  = audio::start_mic_recording(mic_path, stop_mic)
        .map_err(|e| e.to_string())?;
    let h_loop = audio::start_loopback_recording(loopback_path, stop_loop)
        .map_err(|e| e.to_string())?;

    state.handles.lock().unwrap().extend([h_mic, h_loop]);
    *state.asr_mode.lock().unwrap() = Some(AsrMode::Local { wav_dir: dir });

    Ok(())
}

#[tauri::command]
async fn stop_recording(
    app: AppHandle,
    state: State<'_, RecState>,
) -> Result<(), String> {
    emit_status(&app, "processing", "Stopping audio capture...");

    // Signal all audio threads to stop
    state.stop.store(true, Ordering::Relaxed);

    // Join audio threads
    let handles: Vec<_> = state.handles.lock().unwrap().drain(..).collect();
    tokio::task::spawn_blocking(move || {
        for h in handles {
            if let Err(e) = h.join()
                .map_err(|_| anyhow::anyhow!("thread panicked"))
                .and_then(|r| r)
            {
                eprintln!("Audio thread error: {e}");
            }
        }
    })
    .await
    .map_err(|e| e.to_string())?;

    let mode = state.asr_mode.lock().unwrap().take();

    match mode {
        Some(AsrMode::Streaming) => {
            // Dropping the audio senders (above) signals Deepgram tasks to close gracefully.
            // Wait for them to finish.
            let tasks: Vec<_> = state.stream_tasks.lock().unwrap().drain(..).collect();
            for t in tasks {
                let _ = tokio::time::timeout(std::time::Duration::from_secs(5), t).await;
            }
            emit_status(&app, "done", "Transcription complete");
        }
        Some(AsrMode::Local { wav_dir }) => {
            let mic_path  = wav_dir.join("me_stream.wav");
            let loop_path = wav_dir.join("them_stream.wav");

            emit_status(&app, "processing", "Transcribing audio...");

            match run_transcription(&app, &mic_path, &loop_path).await {
                Ok(entries) => {
                    for entry in entries { let _ = app.emit("transcript-update", entry); }
                    emit_status(&app, "done", "Transcription complete");
                }
                Err(e) => emit_status(&app, "error", &format!("Transcription failed: {e}")),
            }

            // Ephemeral audio — delete immediately after transcription
            let _ = std::fs::remove_file(&mic_path);
            let _ = std::fs::remove_file(&loop_path);
        }
        None => emit_status(&app, "idle", "Ready"),
    }

    Ok(())
}

#[tauri::command]
async fn list_audio_devices() -> Result<Vec<String>, String> {
    use cpal::traits::{DeviceTrait, HostTrait};
    let host    = cpal::default_host();
    let devices = host.input_devices().map_err(|e| e.to_string())?;
    Ok(devices.filter_map(|d| d.name().ok()).collect())
}

#[tauri::command]
async fn summarize_transcript(
    transcript: String,
    api_key: String,
    provider: String,
    model: String,
    user_notes: Vec<String>,
) -> Result<String, String> {
    match provider.as_str() {
        "openai" => summarize_openai(transcript, api_key, model, user_notes).await,
        _        => summarize_anthropic(transcript, api_key, user_notes).await,
    }
}

// ── LLM helpers ───────────────────────────────────────────────────────────────

async fn summarize_anthropic(
    transcript: String,
    api_key: String,
    user_notes: Vec<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let prompt = build_prompt(&transcript, &user_notes);

    let body = serde_json::json!({
        "model": "claude-sonnet-4-6",
        "max_tokens": 2048,
        "messages": [{ "role": "user", "content": prompt }]
    });

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    json["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| format!("Anthropic error: {json}"))
}

async fn summarize_openai(
    transcript: String,
    api_key: String,
    model: String,
    user_notes: Vec<String>,
) -> Result<String, String> {
    let client    = reqwest::Client::new();
    let oai_model = if model.starts_with("gpt") { model } else { "gpt-4o".to_string() };
    let prompt    = build_prompt(&transcript, &user_notes);

    let body = serde_json::json!({
        "model": oai_model,
        "max_tokens": 2048,
        "messages": [
            { "role": "system", "content": "You are an expert meeting assistant." },
            { "role": "user",   "content": prompt }
        ]
    });

    let resp = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {api_key}"))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| format!("OpenAI error: {json}"))
}

fn build_prompt(transcript: &str, user_notes: &[String]) -> String {
    let notes_block = if user_notes.is_empty() {
        String::new()
    } else {
        format!(
            "\n\n---\nATTENDEE HIGHLIGHTS (timestamped notes taken live — \
            treat these as signals of what the attendee found most important):\n{}",
            user_notes.join("\n")
        )
    };

    format!(
        "You are an expert meeting assistant.\n\
        Dual-stream transcript: [ME] = local user, [THEM] = remote participants.\n\n\
        TRANSCRIPT:\n{transcript}{notes_block}\n\n\
        Generate a structured meeting summary:\n\
        ## Key Decisions\n\
        ## Action Items  (owner where identifiable)\n\
        ## Discussion Points\n\
        ## Next Steps\n\n\
        Prioritise topics that appear in the attendee highlights. \
        Be concise. Bullet points."
    )
}

// ── Python sidecar transcription (local Whisper) ──────────────────────────────

async fn run_transcription(
    app: &AppHandle,
    mic_path: &PathBuf,
    loop_path: &PathBuf,
) -> anyhow::Result<Vec<TranscriptEntry>> {
    use tauri_plugin_shell::ShellExt;

    let mic_str  = mic_path.to_string_lossy().to_string();
    let loop_str = loop_path.to_string_lossy().to_string();

    let script = if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::from("."))
            .join("sidecar")
            .join("transcribe.py")
    } else {
        app.path()
            .resource_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("sidecar")
            .join("transcribe.py")
    };

    let output = app
        .shell()
        .command("python")
        .args([script.to_string_lossy().as_ref(), &mic_str, &loop_str])
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("Sidecar error: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value = serde_json::from_str(&stdout)?;

    let entries = parsed["entries"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .enumerate()
        .filter_map(|(i, e)| {
            Some(TranscriptEntry {
                id:            i.to_string(),
                speaker:       e["speaker"].as_str()?.to_string(),
                speaker_label: e["speakerLabel"].as_str().map(str::to_string),
                text:          e["text"].as_str()?.to_string(),
                timestamp:     e["timestamp"].as_str()?.to_string(),
                start:         e["start"].as_f64()?,
                end:           e["end"].as_f64()?,
            })
        })
        .collect();

    Ok(entries)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

fn emit_status(app: &AppHandle, phase: &str, message: &str) {
    let _ = app.emit("recording-status", StatusEvent {
        phase:   phase.to_string(),
        message: message.to_string(),
    });
}

// ── App entry point ───────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(RecState::default())
        .invoke_handler(tauri::generate_handler![
            start_recording,
            stop_recording,
            list_audio_devices,
            summarize_transcript,
        ])
        .run(tauri::generate_context!())
        .expect("error while running kefir");
}
