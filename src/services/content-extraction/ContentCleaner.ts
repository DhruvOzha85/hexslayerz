// LSCS v2 — Content Cleaner

/**
 * Post-extraction text cleaning.
 * Normalizes whitespace, fixes broken sentences, and ensures clean output.
 * Mirrors the ConversationCleaner pattern.
 */
export class ContentCleaner {
  /**
   * Clean a raw content string.
   */
  static clean(raw: string): string {
    if (!raw) return "";

    let cleaned = raw;

    // Rule 1: Normalize all CRLF to LF
    cleaned = cleaned.replace(/\r\n/g, "\n");

    // Rule 2: Remove duplicate consecutive blank lines (3+ newlines → 2)
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    // Rule 3: Remove excessive spaces within lines (but not newlines)
    cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

    // Rule 4: Remove leading whitespace on each line
    cleaned = cleaned
      .split("\n")
      .map((line) => line.trimStart())
      .join("\n");

    // Rule 5: Fix broken sentences — join lines that end mid-sentence
    cleaned = cleaned.replace(/([a-z,;])\n([a-z])/g, "$1 $2");

    // Rule 6: Trim overall content
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Clean extracted section text.
   */
  static cleanSection(text: string): string {
    return this.clean(text);
  }

  /**
   * Clean a title string.
   */
  static cleanTitle(title: string): string {
    if (!title) return "";

    let cleaned = title;

    // Remove site suffixes (e.g., " - Wikipedia", " | MDN")
    cleaned = cleaned.replace(/\s*[|\-–—]\s*[^|\-–—]+$/, "");

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }
}
