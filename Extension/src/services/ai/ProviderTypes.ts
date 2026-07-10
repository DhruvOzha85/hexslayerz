import type { Prompt } from "./prompt";

export const AIProviderType = {
  GEMINI: "gemini",
  OPENAI: "openai",
  OPENROUTER: "openrouter",
  GROQ: "groq",
  LOCAL: "local",
} as const;

export type AIProviderType =
  (typeof AIProviderType)[keyof typeof AIProviderType];

export interface AIRequest {
  prompt: Prompt;
  // Extensible for future parameters like temperature, maxTokens, prompt overrides
}

export interface AIResponse {
  title: string;
  content: string;
  providerUsed: AIProviderType;
  // Extensible for future metrics like tokenCount, modelName, latency
}
