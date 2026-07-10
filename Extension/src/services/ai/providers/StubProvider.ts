import type { AIProvider } from "../AIProvider";
import type { AIRequest, AIResponse, AIProviderType } from "../ProviderTypes";

export class StubProvider implements AIProvider {
  private readonly type: AIProviderType;

  constructor(type: AIProviderType) {
    this.type = type;
  }

  async summarize(request: AIRequest): Promise<AIResponse> {
    console.log(
      `[StubProvider:${this.type}] Processing prompt of length:`,
      request.prompt.user.length,
    );

    // Simulate network delay to ensure async boundaries are respected
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      title: "Stub Summarization Title",
      content: `[STUB] Simulated summary content for prompt of length ${request.prompt.user.length}.`,
      providerUsed: this.type,
    };
  }
}
