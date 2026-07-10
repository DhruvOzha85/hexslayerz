import type { Conversation } from "../conversation";
import type { Summary } from "../ai";

/**
 * Represents a complete snapshot of an extracted conversation and its AI-generated summary.
 * This is the primary domain entity that will eventually be stored, searched, and recalled.
 */
export interface Checkpoint {
  id: string; // A unique identifier for this specific checkpoint (UUID)
  version: number; // Schema version (starts at 1)
  createdAt: number; // Unix timestamp of when the checkpoint was built
  conversation: Conversation; // The raw, sanitized conversation data
  summary: Summary; // The validated AI summary
}

/**
 * Standardized result type for checkpoint operations (building, validation, etc.)
 */
export type CheckpointResult =
  { success: true; data: Checkpoint } | { success: false; error: string };

/**
 * Result structure for the Checkpoint validation pipeline.
 */
export interface CheckpointValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
