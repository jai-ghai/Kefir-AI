# Kefir — Local AI Meeting Notetaker

A bot-free, privacy-first desktop meeting notetaker built with Tauri.
Captures your mic and system audio, transcribes locally with Whisper, and
summarises with Claude.

```
[ Mic ]          →  me_stream.wav  ─┐
[ WASAPI Loopback ] →  them_stream.wav ─┤→ faster-whisper → Claude → Summary
```

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node.js 18+ | https://nodejs.org |
| Rust + Cargo | `winget install Rustlang.Rustup` then `rustup default stable` |
| Python 3.10+ | https://python.org |
| Tauri CLI v2 | `cargo install tauri-cli --version ^2` |
| WebView2 | Already on Win 10/11 |

---

## Setup

```bash
# 1. Install JS dependencies
npm install

# 2. Install Python sidecar dependencies
pip install -r sidecar/requirements.txt

# 3. Run in development
npm run tauri dev
```

---

## Configuration

Open the **Settings gear** in the app and paste your Anthropic API key.
The key is stored only in localStorage — never sent to any Kefir server.

For speaker diarization (THEM stream labelled as Speaker_0 / Speaker_1):
1. Accept the model licence at https://huggingface.co/pyannote/speaker-diarization-3.1
2. Set `HF_TOKEN=your_token` in your environment before launching the app.

---

## Architecture

```
src/                     React + TypeScript UI
src-tauri/src/
  lib.rs                 Tauri commands: start_recording, stop_recording, summarize_transcript
  audio.rs               cpal mic capture + Windows WASAPI loopback
sidecar/
  transcribe.py          faster-whisper STT + optional pyannote diarization
```

### Data flow

1. **start_recording** — spawns two threads: mic (cpal) + WASAPI loopback
2. **stop_recording** — joins threads, saves WAV files to a temp dir, invokes Python sidecar
3. Sidecar transcribes both streams → merges by timestamp → emits `transcript-update` events
4. **Generate Summary** → calls `POST /v1/messages` with the Claude Sonnet model

### Clock drift

Over a 1-hour meeting the two hardware clocks drift ~2–5 seconds.
A cross-correlation alignment pass is planned for v0.2.

---

## Building a release

```bash
npm run tauri build
```

The installer appears in `src-tauri/target/release/bundle/`.

---

## Roadmap

- [ ] Real-time 30-second chunk transcription during recording
- [ ] Clock-drift correction via cross-correlation
- [ ] Echo cancellation (AEC) on the mic stream
- [ ] Export transcript as Markdown / DOCX
- [ ] Local LLM via Ollama (no API key required)
