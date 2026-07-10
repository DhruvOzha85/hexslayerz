import type { AIProviderType } from "../ai";

export interface ContextAISettings {
  defaultProvider: AIProviderType;
  theme: "dark" | "light" | "system";
  maxSummaryLength: number;
  autoCreateCheckpoints: boolean;
  requireConfirmation: boolean;
  autoReadResponses?: boolean;
  speechSpeed?: number;
  speechPitch?: number;
  speechVolume?: number;
  voiceURI?: string;
  handsFreeMode?: boolean;
  extractionLanguage?: string;
  apiKeys: {
    gemini?: string;
    groq?: string;
  };
}
