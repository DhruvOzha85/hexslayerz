import type { AIRequest, AIResponse } from "./ProviderTypes";

export interface AIProvider {
  /**
   * Generates a summary for the provided conversation.
   * This is a provider-agnostic contract.
   */
  summarize(request: AIRequest): Promise<AIResponse>;
}
