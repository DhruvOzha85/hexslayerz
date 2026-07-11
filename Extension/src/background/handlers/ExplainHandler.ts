import type { RuntimeRequest, RuntimeResponse } from "../../services";
import { SettingsService } from "../../services/settings";
import { AIProviderType, ProviderFactory, ExplainService } from "../../services/ai";

export const handleExplainText = async (
  request: RuntimeRequest,
  _sender: chrome.runtime.MessageSender
): Promise<RuntimeResponse> => {
  try {
    const payload = request.payload as { text: string; mode: any; targetLang?: string } | undefined;
    if (!payload || !payload.text || !payload.mode) {
      return { success: false, error: "Invalid text selection or mode." };
    }

    const { text, mode, targetLang } = payload;

    // Load settings for API key and provider
    const settings = await SettingsService.loadSettings();
    const providerType = settings.defaultProvider;

    let apiKey: string | undefined;
    if (providerType === AIProviderType.GEMINI) {
      apiKey = settings.apiKeys.gemini;
    } else if (providerType === AIProviderType.GROQ) {
      apiKey = settings.apiKeys.groq;
    }

    // Build explanation prompt
    const prompt = ExplainService.buildPrompt(text, mode, targetLang);

    // Get AI provider and send prompt
    const provider = ProviderFactory.getProvider(providerType, apiKey);
    const response = await provider.summarize({ prompt });

    return {
      success: true,
      data: response.content || "No explanation generated.",
    };
  } catch (error) {
    console.error("[ExplainHandler] Error explaining text:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate explanation.",
    };
  }
};
