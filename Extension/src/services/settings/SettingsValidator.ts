import type { ContextAISettings } from "./SettingsTypes";
import { DEFAULT_SETTINGS } from "./SettingsDefaults";
import { AIProviderType } from "../ai";

export class SettingsValidator {
  /**
   * Validates a settings object, merging it with defaults and correcting invalid fields.
   */
  static validate(input: Partial<ContextAISettings> | null): ContextAISettings {
    if (!input) return { ...DEFAULT_SETTINGS };

    return {
      defaultProvider: Object.values(AIProviderType).includes(
        input.defaultProvider as AIProviderType,
      )
        ? (input.defaultProvider as AIProviderType)
        : DEFAULT_SETTINGS.defaultProvider,
      theme: ["dark", "light", "system"].includes(input.theme as string)
        ? (input.theme as "dark" | "light" | "system")
        : DEFAULT_SETTINGS.theme,
      maxSummaryLength:
        typeof input.maxSummaryLength === "number" && input.maxSummaryLength > 0
          ? input.maxSummaryLength
          : DEFAULT_SETTINGS.maxSummaryLength,
      autoCreateCheckpoints:
        typeof input.autoCreateCheckpoints === "boolean"
          ? input.autoCreateCheckpoints
          : DEFAULT_SETTINGS.autoCreateCheckpoints,
      requireConfirmation:
        typeof input.requireConfirmation === "boolean"
          ? input.requireConfirmation
          : DEFAULT_SETTINGS.requireConfirmation,
      autoReadResponses:
        typeof input.autoReadResponses === "boolean"
          ? input.autoReadResponses
          : DEFAULT_SETTINGS.autoReadResponses,
      speechSpeed:
        typeof input.speechSpeed === "number" && input.speechSpeed > 0
          ? input.speechSpeed
          : DEFAULT_SETTINGS.speechSpeed,
      speechPitch:
        typeof input.speechPitch === "number" && input.speechPitch >= 0
          ? input.speechPitch
          : DEFAULT_SETTINGS.speechPitch,
      speechVolume:
        typeof input.speechVolume === "number" && input.speechVolume >= 0
          ? input.speechVolume
          : DEFAULT_SETTINGS.speechVolume,
      voiceURI:
        typeof input.voiceURI === "string"
          ? input.voiceURI
          : DEFAULT_SETTINGS.voiceURI,
      handsFreeMode:
        typeof input.handsFreeMode === "boolean"
          ? input.handsFreeMode
          : DEFAULT_SETTINGS.handsFreeMode,
      extractionLanguage:
        typeof input.extractionLanguage === "string"
          ? input.extractionLanguage
          : DEFAULT_SETTINGS.extractionLanguage,
      apiKeys: {
        gemini:
          typeof input.apiKeys?.gemini === "string"
            ? input.apiKeys.gemini
            : DEFAULT_SETTINGS.apiKeys.gemini,
        groq:
          typeof input.apiKeys?.groq === "string"
            ? input.apiKeys.groq
            : DEFAULT_SETTINGS.apiKeys.groq,
      },
    };
  }
}
