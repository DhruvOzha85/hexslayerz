import { ReviewAnalyzer } from "./ReviewAnalyzer";
import { ProductComparator } from "./ProductComparator";
import { FakeReviewDetector } from "./FakeReviewDetector";
import { RecommendationEngine } from "./RecommendationEngine";
import { LanguageHandler } from "./LanguageHandler";
import { VoiceOutput } from "./VoiceOutput";
import { ProviderFactory } from "../ai/ProviderFactory";
import { SettingsService } from "../settings";
import { AIProviderType } from "../ai/ProviderTypes";

export type ShoppingIntent = "review" | "compare" | "recommend" | "fake_check" | "unknown";

export class ShoppingAssistant {
  /**
   * Identifies the user's intent based on their query.
   */
  static async identifyIntent(query: string, _language: "English" | "Hindi" | "Marathi"): Promise<ShoppingIntent> {
    const settings = await SettingsService.loadSettings();
    const providerType = settings.defaultProvider;
    let apiKey = providerType === AIProviderType.GEMINI ? settings.apiKeys.gemini : settings.apiKeys.groq;
    const provider = ProviderFactory.getProvider(providerType, apiKey);

    const basePrompt = `Classify the following shopping query into one of the exact following intents: 'review', 'compare', 'recommend', 'fake_check', or 'unknown'.
Return ONLY the intent string, nothing else.

Query: "${query}"`;

    const prompt = {
      system: "You are an intent classification AI.",
      user: LanguageHandler.appendLanguageInstruction(basePrompt, "English") // We only need the English token back
    };

    try {
      const response = await provider.summarize({ prompt });
      const intent = response.content.trim().toLowerCase();
      
      if (["review", "compare", "recommend", "fake_check"].includes(intent)) {
        return intent as ShoppingIntent;
      }
      
      // Fallback heuristics if AI fails to return exact string
      if (intent.includes("compare") || intent.includes("vs")) return "compare";
      if (intent.includes("recommend") || intent.includes("best") || intent.includes("under")) return "recommend";
      if (intent.includes("fake") || intent.includes("genuine") || intent.includes("suspicious")) return "fake_check";
      if (intent.includes("review") || intent.includes("opinion") || intent.includes("pros")) return "review";
      
      return "unknown";
    } catch (e) {
      console.error("Failed to identify intent", e);
      return "unknown";
    }
  }

  /**
   * Processes a generic user query (text or transcribed voice).
   * 1. Detects Language
   * 2. Identifies Intent
   * 3. Routes to specific sub-module
   */
  static async processQuery(query: string, pageText: string = ""): Promise<{ intent: ShoppingIntent, language: string, data: any }> {
    const language = LanguageHandler.detectLanguage(query);
    const intent = await this.identifyIntent(query, language);

    let data: any = null;

    const contextData = pageText ? `User Query: ${query}\n\nPage Data:\n${pageText}` : query;

    switch (intent) {
      case "review":
        data = await ReviewAnalyzer.analyze(contextData, language);
        break;
      case "compare":
        data = await ProductComparator.compare(contextData, language);
        break;
      case "recommend":
        data = await RecommendationEngine.recommend(contextData, language);
        break;
      case "fake_check":
        data = await FakeReviewDetector.detect(contextData, language);
        break;
      default:
        // Default to recommendation if unknown
        data = await RecommendationEngine.recommend(contextData, language);
    }

    return { intent, language, data };
  }

  /**
   * Speaks the result summary based on the intent and data.
   */
  static speakResult(intent: ShoppingIntent, data: any, language: "English" | "Hindi" | "Marathi") {
    let textToSpeak = "";

    if (intent === "review") {
      textToSpeak = data.summary || "No summary available.";
    } else if (intent === "compare") {
      textToSpeak = `I recommend ${data.recommendation}. ${data.reasoning || ""}`;
    } else if (intent === "recommend") {
      textToSpeak = data.summary || "Here are some recommendations.";
      if (data.suggestions && data.suggestions.length > 0) {
        textToSpeak += ` The top suggestion is ${data.suggestions[0].name}, priced at ${data.suggestions[0].price}.`;
      }
    } else if (intent === "fake_check") {
      textToSpeak = `This review appears to be ${data.label}. ${data.reasoning || ""}`;
    } else {
      textToSpeak = data.summary || "Here is what I found.";
    }

    VoiceOutput.speak(textToSpeak, language);
  }
}
