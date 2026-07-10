import type { Summary } from "./SummaryTypes";
import { AIProviderType } from "./ProviderTypes";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class SummaryValidator {
  /**
   * Deterministically validates a generated Summary object.
   * Does NOT mutate the object or repair invalid data.
   */
  static validate(summary: Summary): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Structural Checks
    if (!summary) {
      return {
        valid: false,
        errors: ["Summary object is missing."],
        warnings: [],
      };
    }

    if (!summary.title || summary.title.trim().length === 0) {
      errors.push("Summary title is missing or empty.");
    }

    if (!summary.content || summary.content.trim().length === 0) {
      errors.push("Summary content is missing or empty.");
    }

    if (
      !summary.provider ||
      !Object.values(AIProviderType).includes(summary.provider)
    ) {
      errors.push(`Invalid or missing AI provider: ${summary.provider}`);
    }

    if (
      !summary.generatedAt ||
      typeof summary.generatedAt !== "number" ||
      summary.generatedAt <= 0
    ) {
      errors.push("Summary timestamp (generatedAt) is missing or invalid.");
    }

    // Example of a warning (optional, for robustness)
    if (summary.content && summary.content.trim().length < 20) {
      warnings.push("Summary content is unusually short.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
