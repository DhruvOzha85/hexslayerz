import { useState, useEffect } from "react";
import { useRawPageReader } from "../hooks/useRawPageReader";
import { SpeechSynthesisService } from "../services/voice";

/**
 * A dedicated button component that acts as a raw screen reader
 * for the entire literal website content.
 */
export function ScreenReaderButton() {
  const { startReading, stopReading, pauseReading, resumeReading } = useRawPageReader();
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Subscribe to the global speech service state
  useEffect(() => {
    return SpeechSynthesisService.subscribe((speaking, paused) => {
      setIsSpeaking(speaking);
      setIsPaused(paused);
    });
  }, []);

  if (isSpeaking && !isPaused) {
    return (
      <div className="flex gap-2 w-full">
        <button
          onClick={pauseReading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Pause Reading
        </button>
        <button
          onClick={stopReading}
          className="flex items-center justify-center gap-1.5 rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          Stop
        </button>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div className="flex gap-2 w-full">
        <button
          onClick={resumeReading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Resume Reading
        </button>
        <button
          onClick={stopReading}
          className="flex items-center justify-center gap-1.5 rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          Stop
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => startReading()}
      className="flex flex-1 items-center justify-center gap-1.5 rounded border border-violet-600 bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-600/30"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      Read Page Aloud
    </button>
  );
}
