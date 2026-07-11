// Context(AI) — Content Extraction Handler
import type { RuntimeRequest, RuntimeResponse } from "../../services";
import { TabService } from "../../services/chrome/TabService";
import { RuntimeMessageTypes } from "../../services";

const CONTENT_SCRIPT_TIMEOUT_MS = 15000;

/**
 * Handles EXTRACT_PAGE_CONTENT by forwarding the message
 * to the active tab's content script, with a hard timeout.
 */
export const handleContentExtraction = async (
  _request: RuntimeRequest,
  _sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> => {
  try {
    const tab = await TabService.getActiveTab();

    if (!tab?.id) {
      return { success: false, error: "No active tab found." };
    }

    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      return {
        success: false,
        error: "Cannot extract content from this page.",
      };
    }

    // Race the content script reply against a hard timeout
    const timeoutPromise = new Promise<RuntimeResponse>((resolve) =>
      setTimeout(() => resolve({
        success: false,
        error: "Content script did not respond in time. Please refresh the page (F5) and try again.",
      }), CONTENT_SCRIPT_TIMEOUT_MS)
    );

    const messagePromise = TabService.sendMessageToTab<
      RuntimeRequest,
      RuntimeResponse
    >(tab.id, { type: RuntimeMessageTypes.EXTRACT_PAGE_CONTENT });

    const response = await Promise.race([messagePromise, timeoutPromise]);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
    if (errorMessage.includes("Receiving end does not exist")) {
      return {
        success: false,
        error: "Extension script not loaded on this page. Please refresh the webpage (F5) and try again! (Also, note that extensions cannot extract Chrome system pages or the New Tab page).",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};
