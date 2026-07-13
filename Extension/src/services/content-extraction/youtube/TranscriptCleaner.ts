export class TranscriptCleaner {
  /**
   * Cleans the raw transcript text by removing timestamps,
   * merging broken sentences, and removing noise.
   */
  static cleanTranscript(rawText: string): string {
    if (!rawText) return "";

    // 1. Remove music and noise markers (e.g. [Music], [Applause])
    let cleaned = rawText.replace(/\[.*?\]/g, "");

    // 2. Remove any remaining timestamps if they exist (00:00:00 or 00:00)
    cleaned = cleaned.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, "");

    // 3. Merge broken sentences by replacing newlines with spaces
    cleaned = cleaned.replace(/\n+/g, " ");

    // 4. Clean up multiple spaces
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

    return cleaned;
  }
}
