// Context(AI) — Content Extraction Handler
import type { RuntimeRequest, RuntimeResponse } from "../../services";
import { TabService } from "../../services/chrome/TabService";
import { RuntimeMessageTypes } from "../../services";

/**
 * Handles EXTRACT_PAGE_CONTENT by forwarding the message
 * to the active tab's content script.
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

    if (!tab.url || tab.url.startsWith("chrome://")) {
      return {
        success: false,
        error: "Cannot extract content from this page.",
      };
    }

    const response = await TabService.sendMessageToTab<
      RuntimeRequest,
      RuntimeResponse
    >(tab.id, { type: RuntimeMessageTypes.EXTRACT_PAGE_CONTENT });

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
