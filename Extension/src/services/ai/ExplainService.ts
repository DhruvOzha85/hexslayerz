import type { Prompt } from "./prompt/PromptTypes";

export type ExplainMode = "explain" | "simplify" | "example" | "translate";

export class ExplainService {
  /**
   * Builds the prompt for explain/simplify/example/translate actions
   */
  static buildPrompt(text: string, mode: ExplainMode, targetLang?: string): Prompt {
    let systemPrompt = `You are a helpful reading and learning assistant. Your task is to process the text selection provided by the user.
    
    STRICT RULES:
    1. Reply in the SAME language as the input text, unless the user requested a translation.
    2. Keep explanations clear, structured, and easy to read.
    3. Use formatting (like bolding or bullet points) to make it visually clear.
    4. Provide the explanation directly without introductory conversational fluff (e.g. do not say "Sure, here is the explanation:").
    5. You MUST return your response as a valid JSON object. The JSON object must contain exactly two keys: "title" (a short descriptive title) and "content" (the actual explanation, simplified text, examples, or translation).`;

    let userPrompt = "";

    switch (mode) {
      case "simplify":
        systemPrompt += `\nSimplify the text. Explain it using very simple terms, short sentences, and basic vocabulary so that a child or beginner can easily grasp it.`;
        userPrompt = `Please simplify the following text:\n\n"${text}"`;
        break;
      case "example":
        systemPrompt += `\nProvide 1 or 2 concrete, real-world examples or analogies that illustrate and explain the concept or term in the text selection.`;
        userPrompt = `Please give clear examples for the concept in this text:\n\n"${text}"`;
        break;
      case "translate":
        const langName = targetLang || "English";
        systemPrompt = `You are an expert translator. Translate the text selection into ${langName}.
        Do not add any explanations or notes. Return ONLY the direct translation.`;
        userPrompt = `Please translate the following text into ${langName}:\n\n"${text}"`;
        break;
      case "explain":
      default:
        systemPrompt += `\nExplain the concept, term, or sentence in detail. Define any complex terminology and explain the key meaning of the selection.`;
        userPrompt = `Please explain the following text:\n\n"${text}"`;
        break;
    }

    return {
      system: systemPrompt.trim(),
      user: userPrompt.trim(),
    };
  }
}
