import { RuntimeService, RuntimeMessageTypes } from "../runtime";
import { type Conversation } from "../conversation";
import { SummarizationEngine, type AIProviderType } from "../ai";
import {
  CheckpointBuilder,
  CheckpointStorage,
  CheckpointRecall,
  CheckpointSearch,
  CheckpointFilter,
  type Checkpoint,
} from "../checkpoint";
import { SettingsService, type ContextAISettings } from "../settings";
import { DataService } from "../data";
import { TabService } from "../chrome/TabService";
import type { ExtractedContent } from "../content-extraction";
import { QAEngine, PdfExtractor } from "../content-extraction";

export class ApplicationService {
  /**
   * Orchestrates the complete end-to-end Checkpoint creation pipeline.
   * Extraction -> AI Summarization -> Checkpoint Assembly -> Validation -> Storage
   */
  static async createCheckpoint(
    provider?: AIProviderType,
  ): Promise<Checkpoint> {
    // 1. Get Settings (to determine default provider if none passed)
    const settings = await SettingsService.loadSettings();
    const activeProvider = provider || settings.defaultProvider;

    // 2. Extract Conversation via Runtime Layer
    const extRes = await RuntimeService.sendMessage<void, Conversation>({
      type: RuntimeMessageTypes.EXTRACT_CONVERSATION,
    });
    if (!extRes.success) {
      throw new Error(`Extraction failed: ${extRes.error || "Unknown error"}`);
    }
    if (!extRes.data) {
      throw new Error("Extraction failed: No data returned.");
    }
    const conversation = extRes.data;

    // 3. Generate Summary via AI Engine
    const sumRes = await SummarizationEngine.summarize(
      conversation,
      activeProvider,
    );
    if (!sumRes.success) {
      throw new Error(`Summarization failed: ${sumRes.error}`);
    }
    const summary = sumRes.data;

    // 4. Build immutable checkpoint (generates ID, timestamp)
    const checkpoint = CheckpointBuilder.build(conversation, summary);

    // 5. Validate and Store
    // (Storage internally triggers CheckpointValidator)
    await CheckpointStorage.save(checkpoint);

    return checkpoint;
  }

  // --- Settings Operations ---

  static async loadSettings(): Promise<ContextAISettings> {
    return await SettingsService.loadSettings();
  }

  static async saveSettings(
    updates: Partial<ContextAISettings>,
  ): Promise<ContextAISettings> {
    return await SettingsService.saveSettings(updates);
  }

  static async resetSettings(): Promise<ContextAISettings> {
    return await SettingsService.resetSettings();
  }

  // --- Data Management Operations ---

  static async exportData(): Promise<string> {
    return await DataService.exportData();
  }

  static async importData(jsonString: string): Promise<void> {
    await DataService.importData(jsonString);
  }

  static async createBackup(): Promise<void> {
    await DataService.createBackup();
  }

  static async restoreBackup(): Promise<void> {
    await DataService.restoreBackup();
  }

  // --- Read-Only Operations ---

  static async loadCheckpoints(): Promise<Checkpoint[]> {
    return await CheckpointRecall.getAll();
  }

  static async getCheckpoint(id: string): Promise<Checkpoint | null> {
    return await CheckpointRecall.getById(id);
  }

  static async deleteCheckpoint(id: string): Promise<void> {
    await CheckpointStorage.remove(id);
  }

  static async clearCheckpoints(): Promise<void> {
    await CheckpointStorage.clear();
  }

  // --- Stateless Data Transformations ---

  static searchCheckpoints(
    checkpoints: Checkpoint[],
    query: string,
  ): Checkpoint[] {
    return CheckpointSearch.search(checkpoints, query);
  }

  static filterByProvider(
    checkpoints: Checkpoint[],
    provider: AIProviderType,
  ): Checkpoint[] {
    return CheckpointFilter.filterByProvider(checkpoints, provider);
  }

  static sortByDate(
    checkpoints: Checkpoint[],
    direction: "asc" | "desc",
  ): Checkpoint[] {
    return CheckpointFilter.sortByDate(checkpoints, direction);
  }

  // --- Content Extraction ---

  /**
   * Extracts cleaned, structured content from the current active tab's page or PDF.
   *
   * Sends EXTRACT_PAGE_CONTENT **directly** from the popup to the content script
   * (Popup → Content Script) using chrome.tabs.sendMessage, bypassing the
   * background service worker. This prevents the MV3 service worker from going
   * dormant mid-await and silently dropping the response.
   */
  static async extractPageContent(): Promise<ExtractedContent> {
    const tab = await TabService.getActiveTab();
    if (!tab?.id || !tab.url) {
      throw new Error("No active tab found.");
    }

    // Block restricted Chrome-internal pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("edge://")
    ) {
      throw new Error(
        "Cannot extract content from Chrome system pages. Navigate to a regular webpage."
      );
    }

    // Handle PDFs directly in the popup/background
    if (tab.url.toLowerCase().endsWith(".pdf") || tab.url.startsWith("file://")) {
      try {
        const response = await fetch(tab.url);
        if (!response.ok) throw new Error("Failed to fetch PDF.");
        const arrayBuffer = await response.arrayBuffer();
        return await PdfExtractor.extract(arrayBuffer, tab.url);
      } catch (error) {
        throw new Error(
          `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Send DIRECTLY from popup → content script (skips background service worker)
    // This is the most reliable path in MV3 for popup-initiated extractions.
    let result: { success: boolean; data?: ExtractedContent; error?: string };
    try {
      result = await chrome.tabs.sendMessage(tab.id, {
        type: RuntimeMessageTypes.EXTRACT_PAGE_CONTENT,
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("Receiving end does not exist") || msg.includes("Could not establish connection")) {
        throw new Error(
          "Extension script not loaded on this page. Please refresh the page (F5) and try again."
        );
      }
      throw new Error(`Content extraction failed: ${msg}`);
    }

    if (!result) {
      throw new Error(
        "Content extraction failed: No response from content script. Please refresh the page (F5) and try again."
      );
    }

    if (!result.success) {
      throw new Error(
        `Content extraction failed: ${result.error || "Unknown error"}`
      );
    }

    if (!result.data) {
      throw new Error("Content extraction failed: No data returned.");
    }

    return result.data;
  }

  /**
   * Translate extracted page content into a target language.
   */
  static async translateExtractedContent(
    pageContent: ExtractedContent,
    targetLanguage: string,
  ): Promise<ExtractedContent> {
    const { TranslationEngine } = await import("../content-extraction");
    return await TranslationEngine.translate(pageContent, targetLanguage);
  }

  /**
   * Ask a question about extracted page content using the configured AI provider.
   */
  static async askPageQuestion(
    question: string,
    pageContent: ExtractedContent,
    smartMode?: "student" | "research" | "summary" | "quiz" | null
  ): Promise<string> {
    const result = await QAEngine.ask(question, pageContent, smartMode);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.answer;
  }
}
