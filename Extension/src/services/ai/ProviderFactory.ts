import type { AIProvider } from "./AIProvider";
import { AIProviderType } from "./ProviderTypes";
import { StubProvider } from "./providers/StubProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { GroqProvider } from "./providers/GroqProvider";

export class ProviderFactory {
  /**
   * Instantiates and returns the appropriate AI Provider based on the requested type.
   */
  static getProvider(type: AIProviderType, apiKey?: string): AIProvider {
    switch (type) {
      case AIProviderType.GEMINI:
        return new GeminiProvider(apiKey);
      case AIProviderType.GROQ:
        return new GroqProvider(apiKey);
      case AIProviderType.OPENAI:
      case AIProviderType.OPENROUTER:
      case AIProviderType.LOCAL:
        return new StubProvider(type);
      default:
        throw new Error(`Unsupported AI Provider Type: ${type}`);
    }
  }
}
