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

// Global Speech Recognition instance
let recognition: any = null;

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
    } else if (request.type === RuntimeMessageTypes.START_SPEECH_RECOGNITION) {
      console.log("[LSCS] Starting speech recognition in content script...");
      
      if (!recognition) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          sendResponse({ success: false, error: "Speech recognition not supported" });
          return false;
        }
        
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        
        recognition.onstart = () => {
          chrome.runtime.sendMessage({ type: RuntimeMessageTypes.SPEECH_RECOGNITION_RESULT, payload: { isListening: true, transcript: "", error: null } });
        };
        
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          chrome.runtime.sendMessage({ 
            type: RuntimeMessageTypes.SPEECH_RECOGNITION_RESULT, 
            payload: { isListening: true, transcript: finalTranscript + interimTranscript, error: null } 
          });
        };
        
        recognition.onerror = (event: any) => {
          console.error("[LSCS] SpeechRecognition Error:", event.error);
          chrome.runtime.sendMessage({ 
            type: RuntimeMessageTypes.SPEECH_RECOGNITION_ERROR, 
            payload: { isListening: false, transcript: "", error: event.error } 
          });
        };
        
        recognition.onend = () => {
          chrome.runtime.sendMessage({ type: RuntimeMessageTypes.SPEECH_RECOGNITION_END, payload: { isListening: false } });
        };
      }
      
      try {
        recognition.start();
        sendResponse({ success: true });
      } catch (e: any) {
        console.warn("[LSCS] Speech recognition already started", e);
        sendResponse({ success: true }); // Ignore if already started
      }
    } else if (request.type === RuntimeMessageTypes.STOP_SPEECH_RECOGNITION) {
      if (recognition) {
        recognition.stop();
      }
      sendResponse({ success: true });
    }

    // Return false for synchronous response, since detect(), extract(), and serialize() are synchronous.
    return false;
  },
);
