// LSCS v2 — Q&A Types

export interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type QAResult =
  | { success: true; answer: string }
  | { success: false; error: string };
