import type { AIProvider } from "../AIProvider";
import { AIProviderType, type AIRequest, type AIResponse } from "../ProviderTypes";

export class GroqProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("Groq API key is required. Please set it in Settings.");
    }
    this.apiKey = apiKey;
  }

  async summarize(request: AIRequest): Promise<AIResponse> {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: request.prompt.system },
        { role: "user", content: request.prompt.user }
      ],
      response_format: { type: "json_object" }
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Groq API Error: ${res.status} - ${errBody}`);
      }

      const data = await res.json();
      const textOutput = data?.choices?.[0]?.message?.content;
      
      if (!textOutput) {
        throw new Error("Invalid response structure from Groq API");
      }

      let parsed;
      let content = "No content generated.";
      let title = "Conversation Summary";
      try {
        parsed = JSON.parse(textOutput);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          title = parsed.title || title;
          if (parsed.content !== undefined) {
            content = typeof parsed.content === "string" ? parsed.content : JSON.stringify(parsed.content);
          } else {
            content = textOutput;
          }
        } else {
          content = textOutput;
        }
      } catch (e) {
        content = textOutput;
      }

      return {
        title,
        content,
        providerUsed: AIProviderType.GROQ,
      };
      
    } catch (error: any) {
      console.error("[GroqProvider] Summarization failed:", error);
      throw new Error(error.message || "Unknown Groq API error");
    }
  }
}
