// LSCS v2 — Content Extraction Store
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApplicationService } from "../services";
import type { ExtractedContent, QAMessage } from "../services";

export type SmartMode = "student" | "research" | "summary" | null;

interface ContentState {
  /** The extracted content result, or null if nothing extracted yet */
  extractedContent: ExtractedContent | null;
  /** History of extractions during this session */
  extractionHistory: ExtractedContent[];
  /** Whether an extraction is currently in progress */
  isExtracting: boolean;
  /** Error message from the last failed extraction */
  error: string | null;
  /** Triggers content extraction for the current active tab */
  extractContent: () => Promise<void>;
  /** Load a previous extraction from history */
  loadFromHistory: (index: number) => void;
  /** Clear the extraction history */
  clearHistory: () => void;
  /** Clears active extracted content and resets state */
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

  // --- Smart Modes ---
  /** Currently active AI Smart Mode */
  smartMode: SmartMode;
  /** Sets the active AI Smart Mode */
  setSmartMode: (mode: SmartMode) => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      extractedContent: null,
      extractionHistory: [],
      isExtracting: false,
      error: null,
      chatMessages: [],
      isAsking: false,
      readingProgress: 0,
      lastSpokenMessage: null,
      smartMode: null,

      setReadingProgress: (index) => set({ readingProgress: index }),
      setLastSpokenMessage: (msg) => set({ lastSpokenMessage: msg }),
      setSmartMode: (mode) => set({ smartMode: mode }),

      extractContent: async () => {
        set({ isExtracting: true, error: null });
        try {
          let content = await ApplicationService.extractPageContent();
          
          // Check for translation
          const settings = await ApplicationService.loadSettings();
          if (settings.extractionLanguage && settings.extractionLanguage !== "Original") {
            content = await ApplicationService.translateExtractedContent(content, settings.extractionLanguage);
          }

          set((state) => ({ 
            extractedContent: content, 
            extractionHistory: [content, ...state.extractionHistory],
            isExtracting: false, 
            chatMessages: [] 
          }));
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Content could not be extracted clearly from this page.";
          set({ error: message, isExtracting: false, extractedContent: null });
        }
      },

      loadFromHistory: (index: number) => {
        const { extractionHistory } = get();
        const content = extractionHistory[index];
        if (content) {
          set({
            extractedContent: content,
            chatMessages: [],
            error: null,
          });
        }
      },

      clearHistory: () => {
        set({ extractionHistory: [] });
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
        const { extractedContent, smartMode } = get();
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
            smartMode
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
    }),
    {
      name: "lscs-content-storage",
      partialize: (state) => ({ 
        extractionHistory: state.extractionHistory,
        smartMode: state.smartMode
      }),
    }
  )
);
