// Context(AI) — PDF Extractor Service
import * as pdfjsLib from "pdfjs-dist";
// Instruct Vite to treat the worker file as an asset and return its URL
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { ExtractedContent } from "./ContentExtractionTypes";

// Initialize the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export class PdfExtractor {
  /**
   * Parse a raw PDF ArrayBuffer into our ExtractedContent format
   */
  static async extract(
    pdfData: ArrayBuffer,
    url: string,
  ): Promise<ExtractedContent> {
    try {
      console.log("[Context(AI)] Initializing PDF.js for extraction...");
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      let fullText = "";
      const sections = [];

      // Extract text page by page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Items is an array of text objects
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        // Clean up excessive whitespace
        const cleanPageText = pageText.replace(/\s+/g, " ").trim();

        if (cleanPageText) {
          fullText += cleanPageText + "\n\n";
          
          sections.push({
            heading: `Page ${pageNum}`,
            text: cleanPageText,
          });
        }
      }

      // Try to extract metadata for the title
      let title = "PDF Document";
      try {
        const metadata = await pdfDocument.getMetadata();
        if (metadata.info && (metadata.info as any).Title) {
          title = (metadata.info as any).Title;
        } else {
          // Fallback to filename from URL
          const urlParts = url.split("/");
          const filename = urlParts[urlParts.length - 1]?.split("?")[0];
          if (filename && filename.endsWith(".pdf")) {
            title = decodeURIComponent(filename);
          }
        }
      } catch (e) {
        console.warn("[Context(AI)] Failed to read PDF metadata", e);
      }

      return {
        title,
        content: fullText.trim(),
        sections,
        url,
        websiteType: "documentation", // Treat PDFs as documentation
        extractedAt: Date.now(),
      };
    } catch (error) {
      console.error("[Context(AI)] PDF Extraction failed:", error);
      throw new Error(
        "Failed to parse this PDF. It may be corrupted, encrypted, or image-based.",
      );
    }
  }
}
