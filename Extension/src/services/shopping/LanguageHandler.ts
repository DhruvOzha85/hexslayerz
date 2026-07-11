export class LanguageHandler {
  /**
   * Detects the language of the provided text.
   * Returns 'English', 'Hindi', 'Marathi' or falls back to 'English'.
   */
  static detectLanguage(text: string): "English" | "Hindi" | "Marathi" {
    const hindiRegex = /[\u0900-\u097F]/;
    // Marathi shares the Devanagari script, distinguishing based on specific vocabulary can be complex via simple regex.
    // For simplicity without a full NLP library, we'll look for common Marathi-specific words or just rely on AI prompting.
    // Ideally, the AI prompt itself will be instructed to respond in the language it detects.
    if (hindiRegex.test(text)) {
      if (text.includes("आहे") || text.includes("काय") || text.includes("मराठी")) {
        return "Marathi";
      }
      return "Hindi";
    }
    return "English";
  }

  /**
   * Appends language instruction to the prompt.
   */
  static appendLanguageInstruction(prompt: string, language: "English" | "Hindi" | "Marathi"): string {
    if (language === "English") return prompt;
    return `${prompt}\n\nIMPORTANT: You MUST respond entirely in ${language}.`;
  }
}
