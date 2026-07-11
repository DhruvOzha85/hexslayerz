import { ProviderFactory } from "../ai/ProviderFactory";
import { SettingsService } from "../settings";
import { LanguageHandler } from "./LanguageHandler";
import { AIProviderType } from "../ai/ProviderTypes";

export class ReviewAnalyzer {
  static async analyze(reviewsText: string, language: "English" | "Hindi" | "Marathi"): Promise<any> {
    const settings = await SettingsService.loadSettings();
    const providerType = settings.defaultProvider;
    let apiKey = providerType === AIProviderType.GEMINI ? settings.apiKeys.gemini : settings.apiKeys.groq;

    const provider = ProviderFactory.getProvider(providerType, apiKey);

    const basePrompt = `You are an expert shopping assistant. Analyze the following product reviews and provide:
1. Overall Sentiment (Positive/Negative/Neutral)
2. Top 3 Pros
3. Top 3 Cons
4. A brief summary of what buyers are saying.

Return ONLY a valid JSON object matching this structure:
{
  "sentiment": "Positive|Negative|Neutral",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "summary": "Brief summary text"
}

Reviews:
"""
${reviewsText}
"""
`;

    const prompt = {
      system: "You are a helpful and expert shopping AI assistant that only outputs valid JSON.",
      user: LanguageHandler.appendLanguageInstruction(basePrompt, language),
    };

    const response = await provider.summarize({ prompt });

    try {
      // Try to parse the JSON output from the AI
      let content = response.content.trim();
      if (content.startsWith("\`\`\`json")) {
        content = content.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
      } else if (content.startsWith("\`\`\`")) {
        content = content.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
      }
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse ReviewAnalyzer output", e);
      return {
        sentiment: "Unknown",
        pros: [],
        cons: [],
        summary: "Failed to analyze reviews.",
      };
    }
  }
}
