import { QAEngine } from "../QAEngine";
import type { ExtractedContent } from "../ContentExtractionTypes";

export class VideoSummarizer {
  /**
   * Summarizes the raw transcript using the AI provider.
   * Generates a short summary, key points, and section-wise summary.
   * Detects language and responds in the same language.
   */
  static async summarize(transcriptText: string, title: string): Promise<string> {
    const prompt = `
You are an expert AI Video Summarizer.
The user has provided a raw transcript of a YouTube video titled: "${title}".

TASK:
1. Detect the language of the transcript.
2. Generate the entire response in the SAME LANGUAGE as the transcript.
3. DO NOT return the raw transcript.
4. Format your output EXACTLY as follows:

### Short Summary
(Provide a 3-5 line clear, natural, human-like summary of the video's main idea)

### Key Points
- (Bullet point 1)
- (Bullet point 2)
- (Bullet point 3)
- ...

### Section-wise Summary (Optional if video is long enough)
- **[Topic 1]:** Brief description.
- **[Topic 2]:** Brief description.

TRANSCRIPT:
${transcriptText}
`;

    // Package as mock extracted content to use QAEngine
    const mockContent: ExtractedContent = {
      title: title,
      content: transcriptText,
      sections: [{ heading: "Transcript", text: transcriptText }],
      url: "youtube",
      extractedAt: Date.now(),
      websiteType: "generic"
    };

    // Use QAEngine with the explicit prompt to get the summary
    const response = await QAEngine.ask(prompt, mockContent);
    if (!response.success) {
      throw new Error(`AI Summarization failed: ${response.error}`);
    }
    
    return response.answer;
  }
}
