export class YouTubeDetector {
  /**
   * Detects if the given URL is a valid YouTube video URL.
   */
  static isYouTubeURL(url: string): boolean {
    if (!url) return false;
    return url.includes("youtube.com/watch") || url.includes("youtu.be/");
  }

  /**
   * Extracts the video ID from a YouTube URL.
   */
  static extractVideoId(url: string): string | null {
    if (!url) return null;
    
    // Handle youtu.be/VIDEO_ID
    if (url.includes("youtu.be/")) {
      const match = url.match(/youtu\.be\/([^?&#]+)/);
      return match ? match[1] || null : null;
    }
    
    // Handle youtube.com/watch?v=VIDEO_ID
    const match = url.match(/[?&]v=([^&#]+)/);
    return match ? match[1] || null : null;
  }
}
