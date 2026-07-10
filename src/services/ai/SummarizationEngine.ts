import type { Conversation } from "../conversation";
import { AIProviderType } from "./ProviderTypes";
import type { SummarizationResult, Summary } from "./SummaryTypes";
import { PromptBuilder } from "./prompt";
import { ProviderFactory } from "./ProviderFactory";
import { SummaryValidator } from "./SummaryValidator";

import { SettingsService } from "../settings";

export class SummarizationEngine {
  /**
   * Orchestrates the complete summarization workflow:
   * Conversation -> PromptBuilder -> ProviderFactory -> AIProvider -> Summary
   */
  static async summarize(
    conversation: Conversation,
    providerType: AIProviderType,
  ): Promise<SummarizationResult> {
    try {
      if (!conversation || conversation.messageCount === 0) {
        return {
          success: false,
          error: "Cannot summarize an empty conversation.",
        };
      }

      // Fetch the API key from settings
      const settings = await SettingsService.loadSettings();
      let apiKey: string | undefined;
      
      if (providerType === AIProviderType.GEMINI) {
        apiKey = settings.apiKeys.gemini || import.meta.env.VITE_GOOGLE_AI_API_KEY;
      } else if (providerType === AIProviderType.GROQ) {
        apiKey = settings.apiKeys.groq || import.meta.env.VITE_Groq_AI_API_KEY;
      }

      // 1. Build the provider-agnostic prompt
      const prompt = PromptBuilder.buildPrompt(conversation);

      // 2. Instantiate the requested AI Provider
      const provider = ProviderFactory.getProvider(providerType, apiKey);

      // 3. Execute summarization over the network (or stub)
      const response = await provider.summarize({ prompt });

      // 4. Assemble the deterministic Summary object
      const summary: Summary = {
        title: response.title,
        content: response.content,
        provider: response.providerUsed,
        generatedAt: Date.now(),
      };

      // 5. Validation Pipeline
      const validation = SummaryValidator.validate(summary);
      if (!validation.valid) {
        console.error(
          "[LSCS] AI generated an invalid summary:",
          validation.errors,
        );
        return {
          success: false,
          error: `Generated summary failed validation: ${validation.errors.join(", ")}`,
        };
      }

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error("[LSCS] Summarization Engine Error:", error);
      const message =
        error instanceof Error ? error.message : "Unknown summarization error.";
      return { success: false, error: message };
    }
  }
}
