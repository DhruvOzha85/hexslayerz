// Context(AI) — YouTube Transcript Extractor Orchestrator
import type { ExtractedContent } from "./ContentExtractionTypes";
import { YouTubeDetector, TranscriptFetcher, TranscriptCleaner, VideoSummarizer, VoiceOutput } from "./youtube";

export class YoutubeExtractor {
  /**
   * Orchestrates the entire YouTube extraction, cleaning, summarization, and optional voice output process.
   */
  static async extract(url: string, tabId: number, autoSpeak: boolean = false): Promise<ExtractedContent> {
    try {
      // 1. Detect and validate URL
      if (!YouTubeDetector.isYouTubeURL(url)) {
        throw new Error("Invalid YouTube URL.");
      }

      // 2. Extract Transcript (Using native hybrid execution to bypass CORS)
      const rawTranscript = await TranscriptFetcher.getTranscript(url, 'en');
      const title = await TranscriptFetcher.getVideoTitle(tabId);

      // 3. Clean Transcript
      const cleanText = TranscriptCleaner.cleanTranscript(rawTranscript);

      // 4. Summarize Transcript
      const aiSummary = await VideoSummarizer.summarize(cleanText, title);

      // 5. Voice Integration (if requested, e.g. "Summarize this video")
      if (autoSpeak) {
        await VoiceOutput.speak(tabId, aiSummary, 'en-US'); // In a real scenario, lang code could be detected
      }

      // 6. Return Structured Content
      return {
        title: title,
        content: aiSummary, // We DO NOT return the raw transcript as per rules
        sections: [{ heading: "AI Video Summary", text: aiSummary }],
        url: url,
        extractedAt: Date.now(),
        websiteType: "generic"
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      // Graceful error edge case matching user prompt requirements
      throw new Error(`YouTube Extraction failed: ${msg}`);
    }
  }
}
