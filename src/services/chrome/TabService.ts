import { ChromeService } from "./ChromeService";

export class TabService {
  /**
   * Retrieves the currently active tab in the current window.
   */
  static async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    ChromeService.validateEnvironment();
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? null;
  }

  /**
   * Sends a message to the specified tab.
   */
  static async sendMessageToTab<TRequest, TResponse>(
    tabId: number,
    request: TRequest,
  ): Promise<TResponse> {
    ChromeService.validateEnvironment();
    return await chrome.tabs.sendMessage(tabId, request);
  }

  /**
   * Validates if the given URL is a ChatGPT URL.
   */
  static isChatGPT(url: string | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      return (
        host === "chatgpt.com" ||
        host === "www.chatgpt.com" ||
        host === "chat.openai.com"
      );
    } catch {
      return false;
    }
  }
}
