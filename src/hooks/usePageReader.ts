import { useCallback, useEffect, useRef } from "react";
import { useContentStore, useSettingsStore } from "../stores";
import { SpeechSynthesisService } from "../services/voice";

/**
 * Hook to manage reading an extracted page section by section.
 */
export function usePageReader() {
  const { extractedContent, readingProgress, setReadingProgress } = useContentStore();
  const { settings } = useSettingsStore();
  const isReadingActive = useRef(false);

  // Stop reading if unmounted
  useEffect(() => {
    return () => {
      isReadingActive.current = false;
    };
  }, []);

  const readSection = useCallback((index: number) => {
    if (!extractedContent || index >= extractedContent.sections.length) {
      isReadingActive.current = false;
      return;
    }

    const section = extractedContent.sections[index];
    if (!section) {
      isReadingActive.current = false;
      return;
    }
    const textToRead = `${section.heading ? section.heading + ". " : ""}${section.text}`;

    SpeechSynthesisService.speak(
      textToRead,
      settings?.speechSpeed || 1.0,
      settings?.speechPitch ?? 1.0,
      settings?.speechVolume ?? 1.0,
      settings?.voiceURI,
      () => {
        // onEnd callback
        if (isReadingActive.current) {
          const nextIndex = index + 1;
          setReadingProgress(nextIndex);
          if (nextIndex < extractedContent.sections.length) {
            readSection(nextIndex);
          } else {
            isReadingActive.current = false;
          }
        }
      }
    );
  }, [extractedContent, settings?.speechSpeed, setReadingProgress]);

  const startReading = useCallback((fromBeginning: boolean = false) => {
    if (!extractedContent || extractedContent.sections.length === 0) return;
    
    isReadingActive.current = true;
    const startIndex = fromBeginning ? 0 : readingProgress;
    setReadingProgress(startIndex);
    readSection(startIndex);
  }, [extractedContent, readingProgress, setReadingProgress, readSection]);

  const stopReading = useCallback(() => {
    isReadingActive.current = false;
    SpeechSynthesisService.stop();
  }, []);

  const pauseReading = useCallback(() => {
    isReadingActive.current = false; // Pause stops the auto-advance
    SpeechSynthesisService.pause();
  }, []);

  const resumeReading = useCallback(() => {
    isReadingActive.current = true;
    SpeechSynthesisService.resume();
  }, []);

  return {
    startReading,
    stopReading,
    pauseReading,
    resumeReading,
  };
}
