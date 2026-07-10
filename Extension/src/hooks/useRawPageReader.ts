import { useCallback, useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../stores";
import { SpeechSynthesisService } from "../services/voice";
import { TabService } from "../services/chrome";
import { RuntimeMessageTypes } from "../services/runtime";

export function useRawPageReader() {
  const { settings } = useSettingsStore();
  const [isReadingActive, setIsReadingActive] = useState(false);
  const activeRef = useRef(false);
  const loadingRef = useRef(false);

  // Stop reading if unmounted
  useEffect(() => {
    return () => {
      setIsReadingActive(false);
      activeRef.current = false;
    };
  }, []);

  const startReading = useCallback(async () => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      activeRef.current = true;
      setIsReadingActive(true);
      
      const tab = await TabService.getActiveTab();
      if (!tab?.id) {
        throw new Error("No active tab found.");
      }

      // Fetch the raw text from the content script
      const response = await TabService.sendMessageToTab<any, any>(tab.id, {
        type: RuntimeMessageTypes.EXTRACT_RAW_PAGE_TEXT
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to get text.");
      }

      const textToRead = response.data;
      
      // Split the giant text blob into paragraphs to prevent SpeechSynthesis limits
      const chunks = textToRead
        .split(/\n+/)
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
        
      if (chunks.length === 0) {
        setIsReadingActive(false);
        return;
      }

      let currentChunkIndex = 0;

      const playNextChunk = () => {
        if (!activeRef.current) return;
        
        if (currentChunkIndex >= chunks.length) {
          activeRef.current = false;
          setIsReadingActive(false);
          return;
        }

        SpeechSynthesisService.speak(
          chunks[currentChunkIndex],
          settings?.speechSpeed || 1.0,
          settings?.speechPitch ?? 1.0,
          settings?.speechVolume ?? 1.0,
          settings?.voiceURI,
          () => {
            currentChunkIndex++;
            playNextChunk();
          }
        );
      };

      // Start playing the first chunk
      playNextChunk();

    } catch (error) {
      console.error("[RawPageReader] Failed to read page:", error);
      activeRef.current = false;
      setIsReadingActive(false);
    } finally {
      loadingRef.current = false;
    }
  }, [settings]);

  const stopReading = useCallback(() => {
    activeRef.current = false;
    setIsReadingActive(false);
    SpeechSynthesisService.stop();
  }, []);

  const pauseReading = useCallback(() => {
    SpeechSynthesisService.pause();
  }, []);

  const resumeReading = useCallback(() => {
    SpeechSynthesisService.resume();
  }, []);

  return {
    startReading,
    stopReading,
    pauseReading,
    resumeReading,
    isReadingActive
  };
}
