import { ProviderFactory } from "../ai/ProviderFactory";
import { SettingsService } from "../settings";
import { LanguageHandler } from "./LanguageHandler";
import { AIProviderType } from "../ai/ProviderTypes";

export class RecommendationEngine {
  static async recommend(query: string, language: "English" | "Hindi" | "Marathi"): Promise<any> {
    const settings = await SettingsService.loadSettings();
    const providerType = settings.defaultProvider;
    let apiKey = providerType === AIProviderType.GEMINI ? settings.apiKeys.gemini : settings.apiKeys.groq;

    const provider = ProviderFactory.getProvider(providerType, apiKey);

    const basePrompt = `You are an expert shopping assistant. Based on the user's query, budget, and preferences, provide the best product suggestions.

Return ONLY a valid JSON object matching this structure:
{
  "suggestions": [
    {
      "name": "Product Name",
      "price": "Approximate Price",
      "whyToBuy": "Reasoning behind recommendation"
    }
  ],
  "summary": "Brief encouraging summary message."
}

User Query:
"""
${query}
"""
`;

    const prompt = {
      system: "You are a helpful and expert shopping AI assistant that only outputs valid JSON.",
      user: LanguageHandler.appendLanguageInstruction(basePrompt, language),
    };

    const response = await provider.summarize({ prompt });

    try {
      let content = response.content.trim();
      if (content.startsWith("\`\`\`json")) {
        content = content.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
      } else if (content.startsWith("\`\`\`")) {
        content = content.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
      }
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse RecommendationEngine output", e);
      return {
        suggestions: [],
        summary: "Failed to generate recommendations.",
      };
    }
  }
}
