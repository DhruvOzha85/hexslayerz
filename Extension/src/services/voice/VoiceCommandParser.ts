export const VoiceCommandIntent = {
  READ_PAGE: "read_page",
  SUMMARIZE_PAGE: "summarize_page",
  EXPLAIN_PARAGRAPH: "explain_paragraph",
  READ_IMPORTANT: "read_important",
  STOP_READING: "stop_reading",
  PAUSE: "pause",
  RESUME: "resume",
  REPEAT: "repeat",
} as const;

export type VoiceCommandIntent = (typeof VoiceCommandIntent)[keyof typeof VoiceCommandIntent];

export interface VoiceCommandResult {
  isCommand: boolean;
  intent?: VoiceCommandIntent;
  originalText: string;
}

/**
 * Reusable command parser to detect intents from voice transcripts.
 */
export class VoiceCommandParser {
  private static intentMap = [
    {
      intent: VoiceCommandIntent.STOP_READING,
      regex: /^(stop reading|stop speaking|cancel speech|shut up|be quiet)/i,
    },
    {
      intent: VoiceCommandIntent.PAUSE,
      regex: /^(pause|pause reading|pause speech|wait)/i,
    },
    {
      intent: VoiceCommandIntent.RESUME,
      regex: /^(resume|resume reading|continue|keep going|play)/i,
    },
    {
      intent: VoiceCommandIntent.READ_PAGE,
      regex: /^(read this page|read the page|read everything|read the article)/i,
    },
    {
      intent: VoiceCommandIntent.SUMMARIZE_PAGE,
      regex: /^(summarize this page|summarize the page|give me a summary)/i,
    },
    {
      intent: VoiceCommandIntent.EXPLAIN_PARAGRAPH,
      regex: /^(explain this paragraph|explain the paragraph|explain this section)/i,
    },
    {
      intent: VoiceCommandIntent.READ_IMPORTANT,
      regex: /^(read important points|what are the key takeaways|key takeaways)/i,
    },
    {
      intent: VoiceCommandIntent.REPEAT,
      regex: /^(repeat|repeat that|say that again|read that again)/i,
    },
  ];

  /**
   * Parse a text string to determine if it's a known command.
   */
  static parse(text: string): VoiceCommandResult {
    const cleanText = text.trim();
    
    for (const mapping of this.intentMap) {
      if (mapping.regex.test(cleanText)) {
        return {
          isCommand: true,
          intent: mapping.intent,
          originalText: cleanText,
        };
      }
    }

    return {
      isCommand: false,
      originalText: cleanText,
    };
  }
}
