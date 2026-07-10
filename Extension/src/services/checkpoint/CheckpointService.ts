import type { Conversation } from "../conversation";
import type { Summary } from "../ai";
import { SummaryValidator } from "../ai";
import { StorageService } from "../chrome";

// --- TYPES ---
export interface Checkpoint {
  id: string;
  version: number;
  createdAt: number;
  conversation: Conversation;
  summary: Summary;
}

export type CheckpointResult =
  | { success: true; data: Checkpoint }
  | { success: false; error: string };

export interface CheckpointValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// --- VALIDATOR ---
export class CheckpointValidator {
  static validate(checkpoint: Checkpoint): CheckpointValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!checkpoint) return { valid: false, errors: ["Checkpoint object is missing."], warnings: [] };
    if (!checkpoint.id || typeof checkpoint.id !== "string" || checkpoint.id.trim().length === 0) errors.push("Checkpoint ID is missing or invalid.");
    if (typeof checkpoint.version !== "number" || checkpoint.version < 1) errors.push("Checkpoint version is missing or invalid.");
    if (!checkpoint.createdAt || typeof checkpoint.createdAt !== "number" || checkpoint.createdAt <= 0) errors.push("Checkpoint timestamp (createdAt) is missing or invalid.");

    if (!checkpoint.conversation) {
      errors.push("Checkpoint conversation data is missing.");
    } else if (checkpoint.conversation.messageCount === 0) {
      warnings.push("Checkpoint conversation has zero messages.");
    }

    if (!checkpoint.summary) {
      errors.push("Checkpoint summary data is missing.");
    } else {
      const summaryValidation = SummaryValidator.validate(checkpoint.summary);
      if (!summaryValidation.valid) {
        errors.push(`Nested summary is invalid: ${summaryValidation.errors.join("; ")}`);
      }
      warnings.push(...summaryValidation.warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

// --- STORAGE ---
const STORAGE_KEY = "context_ai_checkpoints";
type CheckpointStore = Record<string, Checkpoint>;

export class CheckpointStorage {
  static async save(checkpoint: Checkpoint): Promise<void> {
    const validation = CheckpointValidator.validate(checkpoint);
    if (!validation.valid) throw new Error(`Cannot save invalid checkpoint: ${validation.errors.join("; ")}`);
    const store = await this.getStore();
    store[checkpoint.id] = checkpoint;
    await StorageService.set(STORAGE_KEY, store);
  }

  static async get(id: string): Promise<Checkpoint | null> {
    const store = await this.getStore();
    return store[id] || null;
  }

  static async getAll(): Promise<Checkpoint[]> {
    const store = await this.getStore();
    return Object.values(store);
  }

  static async remove(id: string): Promise<void> {
    const store = await this.getStore();
    if (store[id]) {
      delete store[id];
      await StorageService.set(STORAGE_KEY, store);
    }
  }

  static async clear(): Promise<void> {
    await StorageService.remove(STORAGE_KEY);
  }

  private static async getStore(): Promise<CheckpointStore> {
    const store = await StorageService.get<CheckpointStore>(STORAGE_KEY);
    return store || {};
  }
}

// --- RECALL ---
export class CheckpointRecall {
  static async getById(id: string): Promise<Checkpoint | null> {
    return await CheckpointStorage.get(id);
  }
  static async getAll(): Promise<Checkpoint[]> {
    return await CheckpointStorage.getAll();
  }
  static async exists(id: string): Promise<boolean> {
    return (await this.getById(id)) !== null;
  }
  static async count(): Promise<number> {
    return (await this.getAll()).length;
  }
}

// --- BUILDER ---
export class CheckpointBuilder {
  static build(conversation: Conversation, summary: Summary): Checkpoint {
    return {
      id: crypto.randomUUID(),
      version: 1,
      createdAt: Date.now(),
      conversation,
      summary,
    };
  }
}

// --- SEARCH ---
export class CheckpointSearch {
  static search(checkpoints: Checkpoint[], query: string): Checkpoint[] {
    if (!query || query.trim().length === 0) return checkpoints.slice();
    const normalizedQuery = this.normalize(query);
    return checkpoints.filter((cp) => {
      if (this.normalize(cp.summary.title).includes(normalizedQuery)) return true;
      if (this.normalize(cp.summary.content).includes(normalizedQuery)) return true;
      for (const msg of cp.conversation.messages) {
        if (this.normalize(msg.content).includes(normalizedQuery)) return true;
      }
      return false;
    });
  }

  private static normalize(text: string): string {
    if (!text) return "";
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }
}

// --- FILTER ---
export class CheckpointFilter {
  static filterByProvider(checkpoints: Checkpoint[], providerId: string): Checkpoint[] {
    return checkpoints.filter((cp) => cp.summary.provider === providerId);
  }
  static sortByDate(checkpoints: Checkpoint[], direction: "asc" | "desc"): Checkpoint[] {
    return checkpoints.slice().sort((a, b) => direction === "asc" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
  }
  static sortByConversationLength(checkpoints: Checkpoint[], direction: "asc" | "desc"): Checkpoint[] {
    return checkpoints.slice().sort((a, b) => {
      const aLen = a.conversation.messageCount;
      const bLen = b.conversation.messageCount;
      return direction === "asc" ? aLen - bLen : bLen - aLen;
    });
  }
}
