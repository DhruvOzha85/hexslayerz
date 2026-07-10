// LSCS v2 — Translation Engine
import type { ExtractedContent } from "./ContentExtractionTypes";
import { ProviderFactory } from "../ai/ProviderFactory";
import { AIProviderType } from "../ai/ProviderTypes";
import { SettingsService } from "../settings";

const TRANSLATION_SYSTEM_PROMPT = `You are a highly accurate translation engine.
Your task is to translate the provided webpage content into the requested language while preserving the exact JSON structure.

INSTRUCTIONS:
1. Translate the 'title', the 'content' block, and every 'text' and 'heading' within the 'sections' array into the requested language.
2. DO NOT change the keys of the JSON object. Keep 'title', 'content', 'url', 'websiteType', 'extractedAt', 'sections', 'heading', and 'text' exactly as they are.
3. DO NOT summarize or alter the meaning. Provide a direct and natural translation.
4. If a piece of text is code, a name, or an untranslatable term, leave it as is.
5. You MUST return ONLY valid JSON matching the exact structure of the input object. No markdown wrappers unless it is part of the original text.`;

export class TranslationEngine {
  /**
   * Translate extracted page content into a target language.
   */
  static async translate(
    pageContent: ExtractedContent,
    targetLanguage: string,
  ): Promise<ExtractedContent> {
    try {
      if (!targetLanguage || targetLanguage === "Original") {
        return pageContent;
      }

      // Load settings for API key and provider
      const settings = await SettingsService.loadSettings();
      const providerType = settings.defaultProvider;

      let apiKey: string | undefined;
      if (providerType === AIProviderType.GEMINI) {
        apiKey = settings.apiKeys.gemini;
      } else if (providerType === AIProviderType.GROQ) {
        apiKey = settings.apiKeys.groq;
      }

      // Limit the sections to avoid massive token usage for translation. 
      // If it's too large, it might fail or cost a lot.
      // We'll pass the full object but truncate if absolutely necessary. For now, pass as JSON.
      const payload = JSON.stringify(pageContent, null, 2);

      const user = `TARGET LANGUAGE: ${targetLanguage}\n\nCONTENT TO TRANSLATE (JSON):\n${payload}`;

      const prompt = {
        system: TRANSLATION_SYSTEM_PROMPT,
        user,
      };

      const provider = ProviderFactory.getProvider(providerType, apiKey);
      const response = await provider.summarize({ prompt });

      // The AI should return a JSON string
      let responseText = response.content.trim();
      
      // Clean up markdown code blocks if the AI wrapped the response
      if (responseText.startsWith("\`\`\`json")) {
        responseText = responseText.replace(/^\`\`\`json/i, "").replace(/\`\`\`$/, "").trim();
      } else if (responseText.startsWith("\`\`\`")) {
        responseText = responseText.replace(/^\`\`\`/i, "").replace(/\`\`\`$/, "").trim();
      }

      const translatedContent: ExtractedContent = JSON.parse(responseText);
      
      // Ensure metadata that shouldn't change is preserved
      translatedContent.url = pageContent.url;
      translatedContent.websiteType = pageContent.websiteType;
      translatedContent.extractedAt = pageContent.extractedAt;

      return translatedContent;
    } catch (error) {
      console.error("[LSCS] Translation Engine error:", error);
      // Fallback to original content if translation fails
      return pageContent;
    }
  }
}
