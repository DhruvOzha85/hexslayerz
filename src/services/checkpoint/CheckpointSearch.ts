import type { Checkpoint } from "./CheckpointTypes";

export class CheckpointSearch {
  /**
   * Returns a new array containing only checkpoints that match the search query.
   * Matches against: Summary Title, Summary Content, and Conversation Messages.
   */
  static search(checkpoints: Checkpoint[], query: string): Checkpoint[] {
    if (!query || query.trim().length === 0) {
      // If query is empty, return a shallow copy to maintain immutability pattern
      return checkpoints.slice();
    }

    const normalizedQuery = this.normalize(query);

    return checkpoints.filter((cp) => {
      // 1. Search Summary Title
      if (this.normalize(cp.summary.title).includes(normalizedQuery)) {
        return true;
      }

      // 2. Search Summary Content
      if (this.normalize(cp.summary.content).includes(normalizedQuery)) {
        return true;
      }

      // 3. Search Conversation Messages
      for (const msg of cp.conversation.messages) {
        if (this.normalize(msg.content).includes(normalizedQuery)) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Helper to normalize strings: lowercase and collapse multiple whitespaces.
   */
  private static normalize(text: string): string {
    if (!text) return "";
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }
}
