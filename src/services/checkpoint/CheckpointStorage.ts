import type { Checkpoint } from "./CheckpointTypes";
import { CheckpointValidator } from "./CheckpointValidator";
import { StorageService } from "../chrome";

const STORAGE_KEY = "lscs_checkpoints";

type CheckpointStore = Record<string, Checkpoint>;

export class CheckpointStorage {
  /**
   * Persists a validated checkpoint.
   * If validation fails, throws a typed error and halts storage.
   */
  static async save(checkpoint: Checkpoint): Promise<void> {
    const validation = CheckpointValidator.validate(checkpoint);
    if (!validation.valid) {
      throw new Error(
        `Cannot save invalid checkpoint: ${validation.errors.join("; ")}`,
      );
    }

    const store = await this.getStore();
    store[checkpoint.id] = checkpoint;
    await StorageService.set(STORAGE_KEY, store);
  }

  /**
   * Retrieves a checkpoint by its ID.
   */
  static async get(id: string): Promise<Checkpoint | null> {
    const store = await this.getStore();
    return store[id] || null;
  }

  /**
   * Retrieves all persisted checkpoints as an array.
   */
  static async getAll(): Promise<Checkpoint[]> {
    const store = await this.getStore();
    return Object.values(store);
  }

  /**
   * Removes a checkpoint by its ID.
   */
  static async remove(id: string): Promise<void> {
    const store = await this.getStore();
    if (store[id]) {
      delete store[id];
      await StorageService.set(STORAGE_KEY, store);
    }
  }

  /**
   * Drops all checkpoints from storage.
   */
  static async clear(): Promise<void> {
    await StorageService.remove(STORAGE_KEY);
  }

  /**
   * Internal helper to fetch the dictionary.
   */
  private static async getStore(): Promise<CheckpointStore> {
    const store = await StorageService.get<CheckpointStore>(STORAGE_KEY);
    return store || {};
  }
}
