import { useRawPageReader } from "../hooks/useRawPageReader";
import { useState } from "react";

/**
 * A dedicated button component that acts as a raw screen reader
 * for the entire literal website content with interactive modes.
 */
export function ScreenReaderButton() {
  const {
    startReading,
    stopReading,
    pauseReading,
    resumeReading,
    repeatLastSection,
    isReadingActive,
    isPaused,
  } = useRawPageReader();

  const [showMenu, setShowMenu] = useState(false);

  const handleStart = (mode: "all" | "selection" | "section" | "summary") => {
    startReading(mode);
    setShowMenu(false);
  };

  return (
    <div className="relative flex flex-col w-full gap-2">
      {/* Option Dropdown Menu */}
      {showMenu && !isReadingActive && (
        <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl z-50 flex flex-col gap-1">
          <div className="px-2 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800/50 pb-1.5 mb-1">
            AI Read Options
          </div>
          <button
            onClick={() => handleStart("all")}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-left"
          >
            📖 Read Entire Page
          </button>
          <button
            onClick={() => handleStart("selection")}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-left"
          >
            🔍 Read Selected Text
          </button>
          <button
            onClick={() => handleStart("section")}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-left"
          >
            🎯 Read Current Section
          </button>
          <button
            onClick={() => handleStart("summary")}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-left"
          >
            📝 Read Important Points
          </button>
        </div>
      )}

      {/* Main Buttons */}
      {isReadingActive ? (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2 w-full">
            {isPaused ? (
              <button
                onClick={resumeReading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Resume Reading
              </button>
            ) : (
              <button
                onClick={pauseReading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause Reading
              </button>
            )}
            <button
              onClick={stopReading}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          </div>

          {/* Sub-controls when active */}
          <div className="flex gap-2 w-full justify-between">
            <button
              onClick={repeatLastSection}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/50 py-1.5 text-[10px] text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              🔁 Repeat Last Section
            </button>
            <button
              onClick={() => handleStart("summary")}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/50 py-1.5 text-[10px] text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              📝 Read Summary
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 w-full">
          <button
            onClick={() => handleStart("all")}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-violet-600 bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-600/30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Read Page Aloud
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex items-center justify-center rounded-lg border px-2.5 py-2 transition-colors ${
              showMenu
                ? "border-violet-600 bg-violet-600/30 text-white"
                : "border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
            title="Read Mode Options"
          >
            ⚙️
          </button>
        </div>
      )}
    </div>
  );
}
