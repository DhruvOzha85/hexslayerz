// Context(AI) — Content Serializer
import type {
  ExtractedContent,
  ExtractionResult,
} from "./ContentExtractionTypes";
import { ContentExtractor } from "./ContentExtractor";
import { ContentCleaner } from "./ContentCleaner";

/**
 * Orchestrates the extraction pipeline and packages output
 * into the final validated JSON structure.
 */
export class ContentSerializer {
  /**
   * Run the full extraction + cleaning + serialization pipeline.
   * Returns either a successful ExtractedContent or graceful error.
   */
  static serialize(): ExtractionResult {
    try {
      // 1. Run raw extraction
      const raw = ContentExtractor.extract();

      // 2. Validate minimum content — fallback to live document body if needed
      let rawFullText = raw.fullText;
      if (!rawFullText || rawFullText.trim().length < 50) {
        // Cloned DOM text extraction may fail on some pages; read from live body as fallback
        rawFullText = document.body.innerText || document.body.textContent || "";
      }

      if (!rawFullText || rawFullText.trim().length < 50) {
        return {
          success: false,
          error: "Content could not be extracted clearly from this page.",
        };
      }

      // 3. Clean all output
      const cleanTitle = ContentCleaner.cleanTitle(raw.title);
      // Truncate to a maximum of 50,000 characters to prevent QuotaExceededError in localStorage.
      // AI models generally max out at ~15k-30k characters for this extension's prompt context anyway.
      let cleanContent = ContentCleaner.clean(rawFullText);
      if (cleanContent.length > 50000) {
        cleanContent = cleanContent.slice(0, 50000) + "\n\n[Content truncated due to size limits...]";
      }

      const cleanSections = raw.sections
        .map((s) => ({
          heading: ContentCleaner.clean(s.heading),
          text: ContentCleaner.cleanSection(s.text),
        }))
        .filter((s) => s.heading || s.text); // Remove empty sections

      // 4. Package into final structure
      const extracted: ExtractedContent = {
        title: cleanTitle || "Untitled Page",
        content: cleanContent,
        // If section extraction yielded nothing, create one section from the full text
        sections: cleanSections.length > 0
          ? cleanSections
          : [{ heading: "", text: cleanContent.slice(0, 5000) }],
        url: window.location.href,
        extractedAt: Date.now(),
        websiteType: raw.websiteType,
      };

      // 5. Final validation
      if (!extracted.content.trim()) {
        return {
          success: false,
          error: "Content could not be extracted clearly from this page.",
        };
      }

      return { success: true, data: extracted };
    } catch (error) {
      console.error("[Context(AI)] Content extraction failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Content could not be extracted clearly from this page.",
      };
    }
  }
}
