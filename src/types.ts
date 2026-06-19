export interface TranscriptEntry {
  id: string;
  speaker: "ME" | "THEM";
  speakerLabel?: string;
  text: string;
  timestamp: string;
  start: number;
  end: number;
}

export interface RecordingStatus {
  phase: "idle" | "recording" | "processing" | "done" | "error";
  message: string;
}

export interface Settings {
  provider:     "anthropic" | "openai";
  anthropicKey: string;
  openAiKey:    string;
  asrProvider:  "local" | "deepgram";
  deepgramKey:  string;
  whisperModel: string;
}
