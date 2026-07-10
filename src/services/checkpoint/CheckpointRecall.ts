import type { Checkpoint } from "./CheckpointTypes";
import { CheckpointStorage } from "./CheckpointStorage";

export class CheckpointRecall {
  /**
   * Retrieves a specific Checkpoint by its unique ID.
   * Returns null if it does not exist.
   */
  static async getById(id: string): Promise<Checkpoint | null> {
    return await CheckpointStorage.get(id);
  }

  /**
   * Retrieves the entire array of stored Checkpoints.
   * Useful for initial UI rendering or batch processing.
   */
  static async getAll(): Promise<Checkpoint[]> {
    return await CheckpointStorage.getAll();
  }

  /**
   * Verifies if a specific Checkpoint exists in storage.
   */
  static async exists(id: string): Promise<boolean> {
    const checkpoint = await this.getById(id);
    return checkpoint !== null;
  }

  /**
   * Returns the total count of stored Checkpoints.
   * Extremely lightweight metadata retrieval.
   */
  static async count(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  }
}
