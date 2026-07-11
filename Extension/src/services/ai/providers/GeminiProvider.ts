import type { AIProvider } from "../AIProvider";
import { AIProviderType, type AIRequest, type AIResponse } from "../ProviderTypes";

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required. Please set it in Settings.");
    }
    this.apiKey = apiKey;
  }

  async summarize(request: AIRequest): Promise<AIResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`;
    
    // Construct the payload for Gemini API
    const payload = {
      system_instruction: {
        parts: { text: request.prompt.system }
      },
      contents: [
        {
          parts: [{ text: request.prompt.user }]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
      }
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API Error: ${res.status} - ${errBody}`);
      }

      const data = await res.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textOutput) {
        throw new Error("Invalid response structure from Gemini API");
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
        providerUsed: AIProviderType.GEMINI,
      };
      
    } catch (error: any) {
      console.error("[GeminiProvider] Summarization failed:", error);
      throw new Error(error.message || "Unknown Gemini API error");
    }
  }
}
