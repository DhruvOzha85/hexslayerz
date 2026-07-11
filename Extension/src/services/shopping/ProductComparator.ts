import { ProviderFactory } from "../ai/ProviderFactory";
import { SettingsService } from "../settings";
import { LanguageHandler } from "./LanguageHandler";
import { AIProviderType } from "../ai/ProviderTypes";

export class ProductComparator {
  static async compare(productsText: string, language: "English" | "Hindi" | "Marathi"): Promise<any> {
    const settings = await SettingsService.loadSettings();
    const providerType = settings.defaultProvider;
    let apiKey = providerType === AIProviderType.GEMINI ? settings.apiKeys.gemini : settings.apiKeys.groq;

    const provider = ProviderFactory.getProvider(providerType, apiKey);

    const basePrompt = `You are an expert shopping assistant. Compare the following products based on Price, Features, Ratings, and Reviews. Provide a structured comparison and a final recommendation.

Return ONLY a valid JSON object matching this structure:
{
  "products": [
    {
      "name": "Product Name",
      "price": "Price",
      "features": ["feature1", "feature2"],
      "rating": "Rating",
      "pros": "Short pros",
      "cons": "Short cons"
    }
  ],
  "recommendation": "Name of the best product",
  "reasoning": "Why this product is the best choice."
}

Products Data:
"""
${productsText}
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
      console.error("Failed to parse ProductComparator output", e);
      return {
        products: [],
        recommendation: "Unknown",
        reasoning: "Failed to compare products.",
      };
    }
  }
}
