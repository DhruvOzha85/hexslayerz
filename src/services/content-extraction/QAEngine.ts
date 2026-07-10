// LSCS v2 — Q&A Engine
import type { ExtractedContent } from "./ContentExtractionTypes";
import type { QAResult } from "./QATypes";
import type { Prompt } from "../ai/prompt/PromptTypes";
import { ProviderFactory } from "../ai/ProviderFactory";
import { AIProviderType } from "../ai/ProviderTypes";
import { SettingsService } from "../settings";

const QA_SYSTEM_PROMPT = `You are an AI browser assistant that answers questions based ONLY on the current webpage content.

Instructions:
- Detect the language of the user's input automatically.
- Reply STRICTLY in the EXACT SAME language as the user.
- If the user asks in Hindi, reply in Hindi.
- If the user asks in Marathi, reply in Marathi.
- If the user asks in English, reply in English.
- Do NOT translate unless necessary.
- Keep the answer clear, concise, and based only on the webpage content.
- Do not add extra information outside the page.

STRICT RULES:
1. Answer ONLY using the provided content. Do NOT use outside knowledge.
2. If the answer is not in the content, say "This information is not available in the extracted content."
3. You MUST return your response as valid JSON: { "title": "Short 3-5 word title in user's language", "content": "Your detailed answer in user's language" }
4. INSTRUCTION: Detect the language of the QUESTION below and reply in that EXACT same language.`;

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
    smartMode?: "student" | "research" | "summary" | null
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
      const prompt = this.buildQAPrompt(question, pageContent, smartMode);

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
    smartMode?: "student" | "research" | "summary" | null
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

    let systemPrompt = QA_SYSTEM_PROMPT;

    if (smartMode === "student") {
      systemPrompt += `\n\nSMART MODE ACTIVE: STUDENT
You are an expert teacher.
Explain the webpage in very simple language.
Use easy English.
Break complex ideas into small sections.
Provide examples wherever possible.
Highlight important terms.
End with 5 key takeaways.`;
    } else if (smartMode === "research") {
      systemPrompt += `\n\nSMART MODE ACTIVE: RESEARCH
You are a research assistant.
Analyze the webpage thoroughly.
Identify important concepts.
Mention advantages and disadvantages.
Provide technical explanations.
Point out assumptions.
Mention limitations if any.
Generate a structured analysis.`;
    } else if (smartMode === "summary") {
      systemPrompt += `\n\nSMART MODE ACTIVE: QUICK SUMMARY
Provide a concise summary of the webpage.
Maximum 5 bullet points.
Highlight only the most important information.
Keep the response under one minute of reading.`;
    }

    return {
      system: systemPrompt,
      user,
    };
  }
}
