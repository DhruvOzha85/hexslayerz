import { create } from "zustand";
import { ShoppingAssistant } from "../services/shopping/ShoppingAssistant";
import { useContentStore } from "./contentStore";
import type { ShoppingIntent } from "../services/shopping/ShoppingAssistant";

interface ShoppingState {
  isProcessing: boolean;
  error: string | null;
  lastQuery: string;
  lastIntent: ShoppingIntent | null;
  lastData: any | null;
  lastLanguage: string;
  
  processQuery: (query: string, useVoiceOutput?: boolean) => Promise<void>;
  clearState: () => void;
}

export const useShoppingStore = create<ShoppingState>()((set) => ({
  isProcessing: false,
  error: null,
  lastQuery: "",
  lastIntent: null,
  lastData: null,
  lastLanguage: "English",

  processQuery: async (query: string, useVoiceOutput: boolean = false) => {
    if (!query.trim()) return;
    
    set({ isProcessing: true, error: null, lastQuery: query });

    try {
      const extractedContent = useContentStore.getState().extractedContent;
      const pageText = extractedContent ? extractedContent.content : "";
      const result = await ShoppingAssistant.processQuery(query, pageText);
      
      set({
        isProcessing: false,
        lastIntent: result.intent,
        lastData: result.data,
        lastLanguage: result.language,
      });

      if (useVoiceOutput) {
        ShoppingAssistant.speakResult(result.intent, result.data, result.language as any);
      }
    } catch (error) {
      set({ 
        isProcessing: false, 
        error: error instanceof Error ? error.message : "Failed to process shopping query." 
      });
    }
  },

  clearState: () => {
    set({
      isProcessing: false,
      error: null,
      lastQuery: "",
      lastIntent: null,
      lastData: null,
      lastLanguage: "English",
    });
  }
}));
