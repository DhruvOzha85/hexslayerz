import { ApplicationService } from "../application/ApplicationService";
import { useContentStore } from "../../stores";

export class AIResponseHandler {
  /**
   * Generates a response from the AI for the given user transcript.
   * Ensures the response is added to the store conversation history.
   * Returns the AI answer.
   */
  static async generate(text: string, lang: "en" | "hi" | "mr"): Promise<string> {
    const store = useContentStore.getState();
    const pageContent = store.extractedContent;

    if (!pageContent) {
      throw new Error("No page content extracted yet. Please extract content first.");
    }

    // 1. Add user message (clean transcript) to the chat messages history
    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: "user" as const,
      content: text,
      timestamp: Date.now(),
    };

    useContentStore.setState({
      chatMessages: [...store.chatMessages, userMsg],
      isAsking: true,
    });

    // 2. Direct the AI to answer in the specific language
    let langName = "English";
    if (lang === "hi") langName = "Hindi";
    if (lang === "mr") langName = "Marathi";

    const languageInstruction = `\n\n[IMPORTANT: Please respond to this question in ${langName}.]`;
    const questionWithLang = text + languageInstruction;

    try {
      // 3. Generate answer
      const answer = await ApplicationService.askPageQuestion(
        questionWithLang,
        pageContent,
        store.smartMode
      );

      // 4. Add AI message to the chat messages history
      const assistantMsg = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant" as const,
        content: answer,
        timestamp: Date.now(),
      };

      useContentStore.setState({
        chatMessages: [...useContentStore.getState().chatMessages, assistantMsg],
        isAsking: false,
        lastSpokenMessage: answer,
      });

      return answer;
    } catch (error) {
      const errorMsg = {
        id: `msg-${Date.now()}-error`,
        role: "assistant" as const,
        content:
          error instanceof Error
            ? `⚠️ ${error.message}`
            : "⚠️ Failed to get an answer.",
        timestamp: Date.now(),
      };

      useContentStore.setState({
        chatMessages: [...useContentStore.getState().chatMessages, errorMsg],
        isAsking: false,
        lastSpokenMessage: errorMsg.content,
      });

      throw error;
    }
  }
}
