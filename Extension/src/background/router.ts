import { RuntimeMessageTypes } from "../services";
import type { RuntimeRequest, RuntimeResponse } from "../services";
import { handlePing } from "./handlers/PingHandler";
import { handleConversationDetection } from "./handlers/ConversationDetectionHandler";
import { handleConversationExtraction } from "./handlers/ConversationExtractionHandler";
import { handleContentExtraction } from "./handlers/ContentExtractionHandler";

type MessageHandler = (
  request: RuntimeRequest,
  sender: chrome.runtime.MessageSender,
) => Promise<RuntimeResponse>;

const routes: Partial<Record<string, MessageHandler>> = {
  [RuntimeMessageTypes.PING]: handlePing,
  [RuntimeMessageTypes.CHECK_CONVERSATION]: handleConversationDetection,
  [RuntimeMessageTypes.EXTRACT_CONVERSATION]: handleConversationExtraction,
  [RuntimeMessageTypes.EXTRACT_PAGE_CONTENT]: handleContentExtraction,
};

export const routeMessage = async (
  request: RuntimeRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: RuntimeResponse) => void,
): Promise<void> => {
  const handler = routes[request.type];

  if (!handler) {
    console.warn(
      `[Router] No handler registered for message type: ${request.type}`,
    );
    sendResponse({ success: false, error: "Unknown message type." });
    return;
  }

  try {
    const response = await handler(request, sender);
    sendResponse(response);
  } catch (error) {
    console.error(`[Router] Error handling ${request.type}:`, error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal routing error",
    });
  }
};
