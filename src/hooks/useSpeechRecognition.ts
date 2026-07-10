import { useState, useEffect, useCallback } from "react";
import { RuntimeMessageTypes } from "../services/runtime/RuntimeMessages";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for messages from the content script
    const messageListener = (message: any) => {
      if (message.type === RuntimeMessageTypes.SPEECH_RECOGNITION_RESULT) {
        if (message.payload.isListening !== undefined) setIsListening(message.payload.isListening);
        if (message.payload.transcript !== undefined) setTranscript(message.payload.transcript);
        if (message.payload.error) setError(message.payload.error);
      } else if (message.type === RuntimeMessageTypes.SPEECH_RECOGNITION_ERROR) {
        setIsListening(false);
        if (message.payload.error === "not-allowed") {
          setError("Microphone access denied on this webpage.");
        } else {
          setError(message.payload.error || "Speech recognition error");
        }
      } else if (message.type === RuntimeMessageTypes.SPEECH_RECOGNITION_END) {
        setIsListening(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const getActiveTabId = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.id;
  };

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    
    const tabId = await getActiveTabId();
    if (!tabId) {
      setError("No active tab found to run speech recognition.");
      return;
    }
    
    try {
      await chrome.tabs.sendMessage(tabId, { type: RuntimeMessageTypes.START_SPEECH_RECOGNITION });
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition in content script:", e);
      setError("Failed to connect to webpage. Try refreshing the page.");
    }
  }, []);

  const stopListening = useCallback(async () => {
    const tabId = await getActiveTabId();
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: RuntimeMessageTypes.STOP_SPEECH_RECOGNITION });
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
