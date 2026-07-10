// LSCS v2 — Q&A Engine
import type { ExtractedContent } from "./ContentExtractionTypes";
import type { QAResult } from "./QATypes";
import type { Prompt } from "../ai/prompt/PromptTypes";
import { ProviderFactory } from "../ai/ProviderFactory";
import { AIProviderType } from "../ai/ProviderTypes";
import { SettingsService } from "../settings";

const QA_SYSTEM_PROMPT = `You are a precise Q&A assistant embedded in a browser extension.
You answer questions ONLY based on the provided webpage content.

STRICT RULES:
1. Answer ONLY using the provided content. Do NOT use outside knowledge.
2. If the answer is not in the content, say "This information is not available in the extracted content."
3. Be concise but thorough.
4. Use bullet points for lists.
5. Quote relevant parts of the content when helpful.
6. You MUST return your response as valid JSON: { "title": "Short 3-5 word title", "content": "Your detailed answer" }`;

/**
 * Q&A Engine — sends questions about extracted content to the configured AI provider.
 * Reuses the existing AIProvider infrastructure without modifying it.
 */
export class QAEngine {
  /**
   * Ask a question about extracted page content.
   */
  static async ask(
    question: string,
    pageContent: ExtractedContent,
  ): Promise<QAResult> {
    try {
      if (!question.trim()) {
        return { success: false, error: "Please enter a question." };
      }

      // Load settings for API key and provider
      const settings = await SettingsService.loadSettings();
      const providerType = settings.defaultProvider;

      let apiKey: string | undefined;
      if (providerType === AIProviderType.GEMINI) {
        apiKey = settings.apiKeys.gemini;
      } else if (providerType === AIProviderType.GROQ) {
        apiKey = settings.apiKeys.groq;
      }

      // Build the Q&A prompt with page context
      const prompt = this.buildQAPrompt(question, pageContent);

      // Get the AI provider
      const provider = ProviderFactory.getProvider(providerType, apiKey);

      // Send to AI (reusing the summarize method — it just sends a prompt)
      const response = await provider.summarize({ prompt });

      return {
        success: true,
        answer: response.content || "No answer generated.",
      };
    } catch (error) {
      console.error("[LSCS] Q&A Engine error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get an answer. Check your API key in Settings.",
      };
    }
  }

  /**
   * Build a prompt containing the page content and the user's question.
   */
  private static buildQAPrompt(
    question: string,
    pageContent: ExtractedContent,
  ): Prompt {
    // Build a condensed version of the content for the prompt
    const sectionsText = pageContent.sections
      .map((s) => {
        const heading = s.heading ? `## ${s.heading}\n` : "";
        return `${heading}${s.text}`;
      })
      .join("\n\n");

    const contextBlock = sectionsText || pageContent.content;

    // Truncate to avoid token limits (~15k chars ≈ ~4k tokens)
    const maxChars = 15000;
    const truncatedContext =
      contextBlock.length > maxChars
        ? contextBlock.slice(0, maxChars) + "\n\n[Content truncated...]"
        : contextBlock;

    const user = `PAGE TITLE: ${pageContent.title}
PAGE URL: ${pageContent.url}
PAGE TYPE: ${pageContent.websiteType}

--- PAGE CONTENT ---
${truncatedContext}
--- END OF CONTENT ---

USER QUESTION: ${question}`;

    return {
      system: QA_SYSTEM_PROMPT,
      user,
    };
  }
}
