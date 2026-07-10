// LSCS v2 — Content Script
import { RuntimeMessageTypes } from "../services";
import type { RuntimeRequest, RuntimeResponse } from "../services";
import {
  ConversationDetector,
  ConversationExtractor,
  ConversationCleaner,
  ConversationSerializer,
} from "../services/conversation";
import { ContentSerializer } from "../services/content-extraction";

console.log("[LSCS] Content script loaded on:", window.location.href);

chrome.runtime.onMessage.addListener(
  (
    request: RuntimeRequest,
    _sender,
    sendResponse: (response: RuntimeResponse) => void,
  ) => {
    if (request.type === RuntimeMessageTypes.CHECK_CONVERSATION) {
      const result = ConversationDetector.detect();

      // Omit the DOM element when serializing back to the background script
      const { conversationRoot: _root, ...serializableResult } = result;

      console.log("[LSCS] Conversation detection result:", serializableResult);
      sendResponse({ success: true, data: serializableResult });
    } else if (request.type === RuntimeMessageTypes.EXTRACT_CONVERSATION) {
      const detection = ConversationDetector.detect();
      if (!detection.supported || !detection.conversationFound) {
        sendResponse({
          success: false,
          error: "No supported conversation found on this page.",
        });
        return false;
      }

      const rawMessages = ConversationExtractor.extract();
      const cleanMessages = ConversationCleaner.clean(rawMessages);
      const serialization = ConversationSerializer.serialize(
        cleanMessages,
        window.location.href,
      );

      if (!serialization.success) {
        console.error("[LSCS] Serialization failed:", serialization.error);
        sendResponse({ success: false, error: serialization.error });
        return false;
      }

      console.log(
        `[LSCS] Successfully serialized conversation with ${serialization.data.messageCount} messages.`,
      );
      sendResponse({ success: true, data: serialization.data });
    } else if (request.type === RuntimeMessageTypes.EXTRACT_PAGE_CONTENT) {
      console.log("[LSCS] Extracting page content...");

      const result = ContentSerializer.serialize();

      if (!result.success) {
        console.warn("[LSCS] Content extraction failed:", result.error);
        sendResponse({ success: false, error: result.error });
        return false;
      }

      console.log(
        `[LSCS] Successfully extracted content: "${result.data.title}" (${result.data.sections.length} sections)`,
      );
      sendResponse({ success: true, data: result.data });
    } else if (request.type === RuntimeMessageTypes.EXTRACT_RAW_PAGE_TEXT) {
      console.log("[LSCS] Extracting raw page text...");
      // For the screen reader bypass — grab all text on the page directly
      const rawText = document.body.innerText || document.body.textContent || "";
      
      if (!rawText.trim()) {
        sendResponse({ success: false, error: "No text found on this page." });
        return false;
      }
      
      sendResponse({ success: true, data: rawText.trim() });
    }

    // Return false for synchronous response, since detect(), extract(), and serialize() are synchronous.
    return false;
  },
);
