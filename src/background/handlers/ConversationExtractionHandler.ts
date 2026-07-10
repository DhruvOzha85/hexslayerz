import type { RuntimeRequest, RuntimeResponse } from "../../services";
import { TabService } from "../../services/chrome/TabService";

export const handleConversationExtraction = async (
  request: RuntimeRequest,
  _sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> => {
  const tab = await TabService.getActiveTab();

  if (!tab || !tab.id) {
    return { success: false, error: "No active tab found" };
  }

  if (!TabService.isChatGPT(tab.url)) {
    return {
      success: false,
      error: "Page is not a supported ChatGPT conversation.",
    };
  }

  try {
    // Delegate to Content Script
    const response = await TabService.sendMessageToTab<
      RuntimeRequest,
      RuntimeResponse
    >(tab.id, request);
    return response;
  } catch (error) {
    console.error("[ConversationExtractionHandler] Error:", error);
    return {
      success: false,
      error:
        "Failed to communicate with content script. Try reloading the page.",
    };
  }
};
