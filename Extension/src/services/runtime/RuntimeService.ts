import type { RuntimeRequest, RuntimeResponse } from "./RuntimeTypes";

export class RuntimeService {
  /**
   * Sends a message to the background script and awaits a response.
   */
  static async sendMessage<TRequest, TResponse>(
    request: RuntimeRequest<TRequest>,
  ): Promise<RuntimeResponse<TResponse>> {
    try {
      if (!chrome || !chrome.runtime) {
        throw new Error("Chrome runtime is not available.");
      }

      const response = await chrome.runtime.sendMessage(request);

      if (!response) {
        throw new Error("No response received from background script.");
      }

      return response as RuntimeResponse<TResponse>;
    } catch (error) {
      console.error("[RuntimeService] Communication error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown communication error",
      };
    }
  }
}
