import type { Checkpoint, CheckpointValidationResult } from "./CheckpointTypes";
import { SummaryValidator } from "../ai";

export class CheckpointValidator {
  /**
   * Deterministically validates a Checkpoint object before storage.
   * Does NOT mutate the checkpoint.
   */
  static validate(checkpoint: Checkpoint): CheckpointValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Root Object Check
    if (!checkpoint) {
      return {
        valid: false,
        errors: ["Checkpoint object is missing."],
        warnings: [],
      };
    }

    // 2. Metadata Checks
    if (
      !checkpoint.id ||
      typeof checkpoint.id !== "string" ||
      checkpoint.id.trim().length === 0
    ) {
      errors.push("Checkpoint ID is missing or invalid.");
    }

    if (typeof checkpoint.version !== "number" || checkpoint.version < 1) {
      errors.push("Checkpoint version is missing or invalid.");
    }

    if (
      !checkpoint.createdAt ||
      typeof checkpoint.createdAt !== "number" ||
      checkpoint.createdAt <= 0
    ) {
      errors.push("Checkpoint timestamp (createdAt) is missing or invalid.");
    }

    // 3. Sub-object Existence Checks
    if (!checkpoint.conversation) {
      errors.push("Checkpoint conversation data is missing.");
    } else if (checkpoint.conversation.messageCount === 0) {
      warnings.push("Checkpoint conversation has zero messages.");
    }

    if (!checkpoint.summary) {
      errors.push("Checkpoint summary data is missing.");
    } else {
      // 4. Delegated Validation
      const summaryValidation = SummaryValidator.validate(checkpoint.summary);
      if (!summaryValidation.valid) {
        errors.push(
          `Nested summary is invalid: ${summaryValidation.errors.join("; ")}`,
        );
      }
      warnings.push(...summaryValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
