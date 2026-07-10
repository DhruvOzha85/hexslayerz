import { useState, useEffect, useCallback, useRef } from "react";
import { TabService } from "../services/chrome/TabService";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Track active tab ID to stop listening on the correct tab
  const activeTabIdRef = useRef<number | null>(null);

  // Listen for messages from the injected content script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (!message || typeof message !== "object") return;
      
      switch (message.type) {
        case "SPEECH_TRANSCRIPT":
          setTranscript(message.payload);
          break;
        case "SPEECH_ERROR":
          console.error("[SpeechRecognition] Error:", message.payload);
          if (message.payload === "not-allowed") {
            setError("Microphone access denied by this website. Please allow it in the URL bar.");
          } else {
            setError(`Speech error: ${message.payload}`);
          }
          setIsListening(false);
          break;
        case "SPEECH_START":
          setIsListening(true);
          setError(null);
          break;
        case "SPEECH_END":
          setIsListening(false);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setTranscript("");
    setError(null);

    const tab = await TabService.getActiveTab();
    if (!tab?.id) {
      setError("No active tab to capture microphone from.");
      return;
    }
    
    activeTabIdRef.current = tab.id;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Declare types for TS compiler in this isolated function context
          const win = window as any;
          if (win._lscsSpeechRecognition) {
             win._lscsSpeechRecognition.start();
             return;
          }

          const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            chrome.runtime.sendMessage({ type: "SPEECH_ERROR", payload: "Speech recognition is not supported in this browser." });
            return;
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            chrome.runtime.sendMessage({ type: "SPEECH_START" });
          };

          recognition.onresult = (event: any) => {
            let finalTranscript = "";
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
              else interimTranscript += event.results[i][0].transcript;
            }
            chrome.runtime.sendMessage({ type: "SPEECH_TRANSCRIPT", payload: finalTranscript + interimTranscript });
          };

          recognition.onerror = (event: any) => {
            chrome.runtime.sendMessage({ type: "SPEECH_ERROR", payload: event.error });
            delete win._lscsSpeechRecognition;
          };

          recognition.onend = () => {
            chrome.runtime.sendMessage({ type: "SPEECH_END" });
            delete win._lscsSpeechRecognition;
          };

          win._lscsSpeechRecognition = recognition;
          recognition.start();
        }
      });
    } catch (err: any) {
      setError("Failed to inject microphone script. Cannot use mic on restricted pages (like chrome://).");
    }
  }, [isListening]);

  const stopListening = useCallback(async () => {
    if (!isListening || !activeTabIdRef.current) return;
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabIdRef.current },
        func: () => {
          const win = window as any;
          if (win._lscsSpeechRecognition) {
            win._lscsSpeechRecognition.stop();
            delete win._lscsSpeechRecognition;
          }
        }
      });
    } catch (e) {
      // Ignore if tab closed or context lost
    } finally {
      setIsListening(false);
    }
  }, [isListening, activeTabIdRef]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening && activeTabIdRef.current) {
        // We cannot reliably call an async func in cleanup, but we try fire-and-forget
        chrome.scripting.executeScript({
          target: { tabId: activeTabIdRef.current },
          func: () => {
            const win = window as any;
            if (win._lscsSpeechRecognition) {
              win._lscsSpeechRecognition.stop();
              delete win._lscsSpeechRecognition;
            }
          }
        }).catch(() => {});
      }
    };
  }, [isListening]);

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
