import { ProviderFactory } from "../ai/ProviderFactory";
import { SettingsService } from "../settings";
import { LanguageHandler } from "./LanguageHandler";
import { AIProviderType } from "../ai/ProviderTypes";

export class FakeReviewDetector {
  static async detect(reviewText: string, language: "English" | "Hindi" | "Marathi"): Promise<any> {
    const settings = await SettingsService.loadSettings();
    const providerType = settings.defaultProvider;
    let apiKey = providerType === AIProviderType.GEMINI ? settings.apiKeys.gemini : settings.apiKeys.groq;

    const provider = ProviderFactory.getProvider(providerType, apiKey);

    const basePrompt = `You are a fraud detection AI for e-commerce. Analyze the following review(s) and determine if they are genuine or suspicious. Look for repetitive patterns, overly positive/negative bias, or spam-like content.

Return ONLY a valid JSON object matching this structure:
{
  "label": "Genuine" | "Suspicious",
  "confidenceScore": 0-100,
  "reasoning": "Explanation for why it's genuine or suspicious."
}

Review(s) Data:
"""
${reviewText}
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
      console.error("Failed to parse FakeReviewDetector output", e);
      return {
        label: "Unknown",
        confidenceScore: 0,
        reasoning: "Failed to analyze review.",
      };
    }
  }
}
