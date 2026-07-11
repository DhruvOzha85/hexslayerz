// Context(AI) — Q&A Engine
import type { ExtractedContent } from "./ContentExtractionTypes";
import type { QAResult } from "./QATypes";
import type { Prompt } from "../ai/prompt/PromptTypes";
import { ProviderFactory } from "../ai/ProviderFactory";
import { AIProviderType } from "../ai/ProviderTypes";
import { SettingsService } from "../settings";

const QA_SYSTEM_PROMPT = `You are an AI browser assistant that answers questions based ONLY on the current webpage content.

Instructions:
- Detect the language of the user's input automatically.
- Reply STRICTLY in the SAME language as the user.
- If the user asks in Hindi, reply in Hindi.
- If the user asks in Marathi, reply in Marathi.
- If the user asks in English, reply in English.
- Do NOT translate unless necessary.
- Keep the answer clear, concise, and based only on the webpage content.
- Do not add extra information outside the page.
- CRITICAL: DO NOT simply copy-paste or extract sentences directly from the text. You MUST read the content, understand it, and synthesize the answer in your own words.

STRICT RULES:
1. You MUST answer based ONLY on the provided webpage content. Do NOT use or add extra information from outside the page.
2. You MUST return your response as valid JSON: { "title": "Short 3-5 word title in user's language", "content": "Your detailed answer in user's language" }
3. INSTRUCTION: Detect the language of the user's input below and reply in that SAME language.`;

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
    smartMode?: "student" | "research" | "summary" | "quiz" | null
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
      console.error("[Context(AI)] Q&A Engine error:", error);
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
    smartMode?: "student" | "research" | "summary" | "quiz" | null
  ): Prompt {
    // Build a condensed version of the content for the prompt
    const sectionsText = pageContent.sections
      .map((s) => {
        const heading = s.heading ? `## ${s.heading}\n` : "";
        return `${heading}${s.text}`;
      })
      .join("\n\n");

    const contextBlock = sectionsText || pageContent.content;

    // Truncate to avoid extremely massive payloads, but keep it high enough for full pages (~100k chars ≈ ~25k tokens)
    const maxChars = 100000;
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

USER QUESTION: ${question}

CRITICAL LANGUAGE REQUIREMENT:
Detect the language of the "USER QUESTION" above. You MUST write your JSON response ("title" and "content") in that EXACT SAME language.
- If the USER QUESTION is in Hindi, you MUST write the answer in Hindi.
- If the USER QUESTION is in Marathi, you MUST write the answer in Marathi.
- If the USER QUESTION is in English, you MUST write the answer in English.
Do NOT respond in English if the question is in Hindi or Marathi.`;

    let systemPrompt = QA_SYSTEM_PROMPT;

    if (smartMode === "student") {
      systemPrompt += `\n\nSMART MODE ACTIVE: STUDENT
You are an expert teacher.
Explain the webpage in very simple language.
Use easy, simple language matching the user's language.
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
You are an intelligent summarization engine.

Your task is to generate a high-quality summary of the given content.

⚠️ RULES:
- DO NOT copy sentences directly from the text
- DO NOT just take the first few lines
- Understand the full context before summarizing
- Rewrite everything in your own words

-----------------------------------

🎯 OUTPUT REQUIREMENTS:

- Length: 3–5 lines per section
- Style: Clear, natural, human-like
- Coverage: Include key ideas, not minor details
- Tone: Informative and easy to understand
- Avoid repetition

-----------------------------------

📄 FOR LONG CONTENT (PDF / Webpage):

- Break content into logical sections
- Summarize EACH section separately
- Each section summary = 2–4 lines
- Maintain flow between sections

-----------------------------------

🧠 QUALITY CHECK:

Your summary should:
✔ Capture the main idea  
✔ Be shorter but meaningful  
✔ Not feel like copy-paste  
✔ Be easy to read aloud  

-----------------------------------

Now summarize the following content:PDF → Split into pages/sections
     → Summarize each chunk
     → Combine results`;
    } else if (smartMode === "quiz") {
      systemPrompt = `You are a quiz generation assistant. Your task is to generate an interactive multiple-choice quiz based strictly on the webpage content.
      
      STRICT RULES:
      1. You MUST return your response as valid JSON: { "title": "Interactive Quiz", "content": "raw JSON array of questions" }
      2. The "content" field MUST be a string containing a valid JSON array of 3 objects.
      3. Do NOT add any markdown formatting, text, or commentary outside the JSON array in the "content" field.
      4. Each question object in the JSON array must contain: "question" (string), "options" (array of 4 choice strings starting with A), B), C), D)), "correctIndex" (number 0 to 3), and "explanation" (string explaining the correct answer).`;
    }

    return {
      system: systemPrompt,
      user,
    };
  }
}
