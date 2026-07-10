// LSCS v2 — Content Extraction Store
import { create } from "zustand";
import { ApplicationService } from "../services";
import type { ExtractedContent, QAMessage } from "../services";

interface ContentState {
  /** The extracted content result, or null if nothing extracted yet */
  extractedContent: ExtractedContent | null;
  /** Whether an extraction is currently in progress */
  isExtracting: boolean;
  /** Error message from the last failed extraction */
  error: string | null;
  /** Triggers content extraction for the current active tab */
  extractContent: () => Promise<void>;
  /** Clears extracted content and resets state */
  clearContent: () => void;

  // --- Q&A Chat ---
  /** Chat message history */
  chatMessages: QAMessage[];
  /** Whether the AI is currently generating a response */
  isAsking: boolean;
  /** Send a question about the extracted content */
  askQuestion: (question: string) => Promise<void>;
  /** Clear chat history */
  clearChat: () => void;
  
  // --- Voice & Reading ---
  /** Current section index for reading progress */
  readingProgress: number;
  /** Sets the current reading progress */
  setReadingProgress: (index: number) => void;
  /** The last AI message read aloud */
  lastSpokenMessage: string | null;
  /** Sets the last spoken message for repetition */
  setLastSpokenMessage: (msg: string | null) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  extractedContent: null,
  isExtracting: false,
  error: null,
  chatMessages: [],
  isAsking: false,
  readingProgress: 0,
  lastSpokenMessage: null,

  setReadingProgress: (index) => set({ readingProgress: index }),
  setLastSpokenMessage: (msg) => set({ lastSpokenMessage: msg }),

  extractContent: async () => {
    set({ isExtracting: true, error: null });
    try {
      const content = await ApplicationService.extractPageContent();
      set({ extractedContent: content, isExtracting: false, chatMessages: [] });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Content could not be extracted clearly from this page.";
      set({ error: message, isExtracting: false, extractedContent: null });
    }
  },

  clearContent: () => {
    set({
      extractedContent: null,
      error: null,
      isExtracting: false,
      chatMessages: [],
      isAsking: false,
    });
  },

  askQuestion: async (question: string) => {
    const { extractedContent } = get();
    if (!extractedContent || !question.trim()) return;

    // Add user message
    const userMsg: QAMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: question.trim(),
      timestamp: Date.now(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      isAsking: true,
    }));

    try {
      const answer = await ApplicationService.askPageQuestion(
        question.trim(),
        extractedContent,
      );

      const assistantMsg: QAMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: answer,
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMsg],
        isAsking: false,
      }));
    } catch (error) {
      const errorMsg: QAMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content:
          error instanceof Error
            ? `⚠️ ${error.message}`
            : "⚠️ Failed to get an answer. Check your API key in Settings.",
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        isAsking: false,
      }));
    }
  },

  clearChat: () => {
    set({ chatMessages: [], isAsking: false });
  },
}));
