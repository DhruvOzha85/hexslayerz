import type { RuntimeRequest, RuntimeResponse } from "../../services";
import { TabService } from "../../services/chrome/TabService";

export const handleConversationDetection = async (
  request: RuntimeRequest,
  _sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> => {
  const tab = await TabService.getActiveTab();

  if (!tab || !tab.id) {
    return { success: false, error: "No active tab found" };
  }

  if (!TabService.isChatGPT(tab.url)) {
    return {
      success: true,
      data: { supported: false, conversationFound: false, url: tab.url },
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
    console.error("[ConversationDetectionHandler] Error:", error);
    return {
      success: false,
      error:
        "Failed to communicate with content script. Try reloading the page.",
    };
  }
};
