import type { Context(AI)sSettings } from "./SettingsTypes";
import { AIProviderType } from "../ai";

export const DEFAULT_SETTINGS: Context(AI)sSettings = {
  defaultProvider: AIProviderType.GEMINI,
  theme: "dark",
  maxSummaryLength: 500,
  autoCreateCheckpoints: false,
  requireConfirmation: true,
  autoReadResponses: true,
  speechSpeed: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  voiceURI: undefined,
  handsFreeMode: false,
  extractionLanguage: "Original",
  apiKeys: {},
};
