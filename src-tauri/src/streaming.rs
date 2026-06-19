/// Deepgram real-time WebSocket streaming.
///
/// Flow:
///   audio thread  ──bytes──►  UnboundedSender
///                                  │
///                         tokio task (this module)
///                                  │
///                         WS send ──► Deepgram API ──► WS recv
///                                                          │
///                                               parse JSON ► emit "transcript-update"

use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::{client::IntoClientRequest, Message};

// ── Public entry point ────────────────────────────────────────────────────────

/// Spawns the Deepgram stream task and returns an audio byte sender immediately
/// (no await needed — caller hands the sender to the audio capture thread).
pub fn spawn_deepgram(
    app: AppHandle,
    api_key: String,
    sample_rate: u32,
    channels: u16,
    speaker: &'static str,
) -> (mpsc::UnboundedSender<Vec<u8>>, tokio::task::JoinHandle<()>) {
    let (audio_tx, audio_rx) = mpsc::unbounded_channel::<Vec<u8>>();

    let task = tokio::spawn(async move {
        if let Err(e) = run_stream(app, api_key, sample_rate, channels, speaker, audio_rx).await {
            eprintln!("Deepgram [{speaker}] stream error: {e}");
        }
    });

    (audio_tx, task)
}

// ── Internal stream runner ────────────────────────────────────────────────────

async fn run_stream(
    app: AppHandle,
    api_key: String,
    sample_rate: u32,
    channels: u16,
    speaker: &'static str,
    mut audio_rx: mpsc::UnboundedReceiver<Vec<u8>>,
) -> Result<()> {
    let url = format!(
        "wss://api.deepgram.com/v1/listen\
        ?model=nova-2\
        &encoding=linear16\
        &sample_rate={sample_rate}\
        &channels={channels}\
        &punctuate=true\
        &smart_format=true\
        &interim_results=false\
        &language=en"
    );

    let mut request = url.into_client_request()?;
    request
        .headers_mut()
        .insert("Authorization", format!("Token {api_key}").parse()?);

    let (ws, _) = tokio_tungstenite::connect_async(request).await?;
    let (mut ws_tx, mut ws_rx) = ws.split();

    // ── Send task: forward audio bytes to Deepgram ────────────────────────────
    let send_task = tokio::spawn(async move {
        while let Some(bytes) = audio_rx.recv().await {
            if ws_tx.send(Message::Binary(bytes)).await.is_err() {
                break;
            }
        }
        // Gracefully close the Deepgram stream
        let _ = ws_tx
            .send(Message::Text(r#"{"type":"CloseStream"}"#.to_string()))
            .await;
        let _ = ws_tx.close().await;
    });

    // ── Receive task: parse Deepgram JSON → emit Tauri events ─────────────────
    let mut seq: u64 = 0;
    while let Some(msg) = ws_rx.next().await {
        let text = match msg? {
            Message::Text(t)  => t,
            Message::Close(_) => break,
            _                 => continue,
        };

        let json: serde_json::Value = match serde_json::from_str(&text) {
            Ok(v)  => v,
            Err(_) => continue,
        };

        // Only process final transcript results
        if json["type"] != "Results" || json["is_final"] != true {
            continue;
        }

        let transcript = json["channel"]["alternatives"][0]["transcript"]
            .as_str()
            .unwrap_or("")
            .trim()
            .to_string();

        if transcript.is_empty() {
            continue;
        }

        let start    = json["start"].as_f64().unwrap_or(0.0);
        let duration = json["duration"].as_f64().unwrap_or(0.0);

        seq += 1;
        let entry = TranscriptEvent {
            id:           format!("{speaker}-{seq}"),
            speaker:      speaker.to_string(),
            speaker_label: None,
            text:         transcript,
            timestamp:    fmt_ts(start),
            start,
            end:          start + duration,
        };

        let _ = app.emit("transcript-update", entry);
    }

    send_task.abort();
    Ok(())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
struct TranscriptEvent {
    id:            String,
    speaker:       String,
    #[serde(rename = "speakerLabel")]
    speaker_label: Option<String>,
    text:          String,
    timestamp:     String,
    start:         f64,
    end:           f64,
}

fn fmt_ts(seconds: f64) -> String {
    let h = (seconds / 3600.0) as u64;
    let m = ((seconds % 3600.0) / 60.0) as u64;
    let s = (seconds % 60.0) as u64;
    format!("{h:02}:{m:02}:{s:02}")
}
