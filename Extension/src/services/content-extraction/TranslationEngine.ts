// Context(AI) — Translation Engine
import type { ExtractedContent } from "./ContentExtractionTypes";
import { ProviderFactory } from "../ai/ProviderFactory";
import { AIProviderType } from "../ai/ProviderTypes";
import { SettingsService } from "../settings";

const TRANSLATION_SYSTEM_PROMPT = `You are a highly accurate translation engine.
Your task is to translate the provided webpage content into the requested language while preserving the exact JSON structure.

INSTRUCTIONS:
1. Translate the 'title', and every 'text' and 'heading' within the 'sections' array into the requested language.
2. DO NOT change the keys of the JSON object. Keep 'title', 'sections', 'heading', and 'text' exactly as they are.
3. DO NOT summarize or alter the meaning. Provide a direct and natural translation.
4. If a piece of text is code, a name, or an untranslatable term, leave it as is.
5. You MUST return ONLY valid JSON matching the exact structure of the input object. No markdown wrappers.`;

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

      // Limit payload size based on provider to avoid Token limits (e.g. Groq 413 error)
      const MAX_CHARS = providerType === AIProviderType.GROQ ? 15000 : 100000;
      
      const payloadObj = {
        title: pageContent.title,
        sections: [] as typeof pageContent.sections,
      };

      let currentLength = JSON.stringify(payloadObj).length;
      let wasTruncated = false;

      for (const section of pageContent.sections) {
        const sectionLength = JSON.stringify(section).length;
        if (currentLength + sectionLength > MAX_CHARS) {
          wasTruncated = true;
          break;
        }
        payloadObj.sections.push(section);
        currentLength += sectionLength;
      }

      const payload = JSON.stringify(payloadObj, null, 2);
      const user = `TARGET LANGUAGE: ${targetLanguage}\n\nCONTENT TO TRANSLATE (JSON):\n${payload}`;

      const prompt = {
        system: TRANSLATION_SYSTEM_PROMPT,
        user,
      };

      const provider = ProviderFactory.getProvider(providerType, apiKey);
      const response = await provider.summarize({ prompt });

      let responseText = response.content.trim();
      
      // Robust JSON extraction: Find the first '{' and last '}'
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        responseText = responseText.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error("No JSON object found in the translation response.");
      }

      const translatedObj = JSON.parse(responseText);
      
      // Reconstruct the ExtractedContent
      const translatedSections = translatedObj.sections || payloadObj.sections;
      
      let finalContent = translatedSections.map((s: any) => `${s.heading ? s.heading + '\n' : ''}${s.text}`).join('\n\n');
      
      if (wasTruncated) {
        finalContent += "\n\n[Note: The original webpage was too large and has been truncated to fit within translation token limits.]";
      }

      const translatedContent: ExtractedContent = {
        title: translatedObj.title || pageContent.title,
        sections: translatedSections,
        content: finalContent,
        url: pageContent.url,
        websiteType: pageContent.websiteType,
        extractedAt: pageContent.extractedAt,
      };

      return translatedContent;
    } catch (error) {
      console.error("[Context(AI)] Translation Engine error:", error);
      // Throw error so the UI can show a notification rather than silently failing
      throw new Error("Failed to translate the content. Please try again or check API token limits.");
    }
  }
}
