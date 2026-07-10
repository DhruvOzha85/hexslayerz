import type { Conversation } from "../conversation";
import type { Summary } from "../ai";
import type { Checkpoint } from "./CheckpointTypes";

export class CheckpointBuilder {
  /**
   * Constructs a deterministic, immutable Checkpoint object.
   * Does NOT validate or store the checkpoint.
   */
  static build(conversation: Conversation, summary: Summary): Checkpoint {
    // Generate structural metadata
    const id = crypto.randomUUID ? crypto.randomUUID() : `chkpt-${Date.now()}`;
    const createdAt = Date.now();
    const version = 1;

    // Return a deeply uncoupled object to prevent reference mutation
    return {
      id,
      version,
      createdAt,
      // We stringify/parse to guarantee the builder does not retain or pass mutable references
      conversation: JSON.parse(JSON.stringify(conversation)),
      summary: JSON.parse(JSON.stringify(summary)),
    };
  }
}
