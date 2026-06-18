#!/usr/bin/env python3
"""
Kefir transcription sidecar.

Usage:  python transcribe.py <mic_wav> <sys_wav>
Output: JSON to stdout — {"entries": [...]}

Requires:  pip install faster-whisper
Optional:  pip install pyannote.audio torch  (for speaker diarization on THEM stream)
"""

import sys
import json
import os
from pathlib import Path


WHISPER_MODEL = os.environ.get("KEFIR_WHISPER_MODEL", "base")
HF_TOKEN      = os.environ.get("HF_TOKEN", "")  # needed for pyannote


def transcribe_with_whisper(wav_path: str, label: str) -> list[dict]:
    """Transcribe a WAV file using faster-whisper. Returns timestamped segments."""
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError:
        return [{
            "start": 0.0, "end": 0.0,
            "text": "[Install faster-whisper: pip install faster-whisper]",
            "speaker": label,
        }]

    model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        wav_path,
        beam_size=5,
        language="en",
        vad_filter=True,        # skip silence automatically
    )
    return [
        {"start": s.start, "end": s.end, "text": s.text.strip(), "speaker": label}
        for s in segments
        if s.text.strip()
    ]


def diarize_them_stream(wav_path: str, segments: list[dict]) -> list[dict]:
    """
    Optional: annotate THEM segments with Speaker_0 / Speaker_1 labels
    via pyannote.audio diarization.  Falls back to plain 'THEM' if unavailable.
    """
    if not HF_TOKEN:
        return segments
    try:
        from pyannote.audio import Pipeline  # type: ignore
        import torch  # type: ignore

        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HF_TOKEN,
        )
        diarization = pipeline(wav_path)

        for seg in segments:
            mid = (seg["start"] + seg["end"]) / 2
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                if turn.start <= mid <= turn.end:
                    seg["speakerLabel"] = speaker
                    break
    except Exception as e:
        print(f"Diarization skipped: {e}", file=sys.stderr)

    return segments


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def main() -> None:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: transcribe.py <mic_wav> <sys_wav>"}))
        sys.exit(1)

    mic_path = sys.argv[1]
    sys_path = sys.argv[2]

    me_segs   = transcribe_with_whisper(mic_path, "ME")   if os.path.exists(mic_path)  else []
    them_segs = transcribe_with_whisper(sys_path, "THEM") if os.path.exists(sys_path)  else []
    them_segs = diarize_them_stream(sys_path, them_segs)

    all_segs = sorted(me_segs + them_segs, key=lambda s: s["start"])

    entries = [
        {
            "id":           str(i),
            "speaker":      s["speaker"],
            "speakerLabel": s.get("speakerLabel"),
            "text":         s["text"],
            "timestamp":    fmt_ts(s["start"]),
            "start":        s["start"],
            "end":          s["end"],
        }
        for i, s in enumerate(all_segs)
    ]

    print(json.dumps({"entries": entries}))


if __name__ == "__main__":
    main()
