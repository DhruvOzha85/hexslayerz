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
   */
  static async extractPageContent(): Promise<ExtractedContent> {
    const tab = await TabService.getActiveTab();
    if (!tab?.id || !tab.url) {
      throw new Error("No active tab found.");
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

    // Handle normal webpages via the content script
    const result = await RuntimeService.sendMessage<void, ExtractedContent>({
      type: RuntimeMessageTypes.EXTRACT_PAGE_CONTENT,
    });

    if (!result.success) {
      throw new Error(
        `Content extraction failed: ${result.error || "Unknown error"}`,
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
    smartMode?: "student" | "research" | "summary" | null
  ): Promise<string> {
    const result = await QAEngine.ask(question, pageContent, smartMode);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.answer;
  }
}
