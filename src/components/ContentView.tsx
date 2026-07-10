import { useContentStore } from "../stores";
import { TabService } from "../services/chrome/TabService";
import { ContentChat } from "./ContentChat";
import { ScreenReaderButton } from "./ScreenReaderButton";

/**
 * Content extraction view — displays a clean, structured extraction
 * of the current page's meaningful content, with AI Q&A chat.
 */
export function ContentView() {
  const { 
    extractedContent, 
    extractionHistory,
    isExtracting, 
    error, 
    extractContent, 
    clearContent,
    loadFromHistory,
    clearHistory
  } = useContentStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={extractContent}
          disabled={isExtracting}
          id="extract-content-btn"
          className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600"
        >
          {isExtracting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Extracting...
            </span>
          ) : (
            "Extract Page Content"
          )}
        </button>

        {extractedContent && (
          <button
            onClick={clearContent}
            className="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            title="Clear extracted content"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/50 p-3">
          <p className="text-xs font-medium text-red-400">Extraction Failed</p>
          <p className="mt-1 text-xs text-red-300/70">{error}</p>
        </div>
      )}

      {/* Empty State / History List */}
      {!extractedContent && !isExtracting && !error && (
        <>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="mb-3 h-10 w-10 text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-sm text-neutral-500">No content extracted yet</p>
            <p className="mt-1 text-xs text-neutral-600">
              Navigate to any webpage and click &quot;Extract&quot; to pull clean content.
            </p>
          </div>

          {/* History Section */}
          {extractionHistory.length > 0 && (
            <div className="mt-4 border-t border-neutral-800 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-300">Recent Extractions</h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {extractionHistory.map((historyItem, idx) => (
                  <div
                    key={historyItem.extractedAt + idx}
                    onClick={() => loadFromHistory(idx)}
                    className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 transition-colors hover:bg-neutral-800"
                  >
                    <h4 className="text-sm font-medium text-white truncate">
                      {historyItem.title}
                    </h4>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                        {historyItem.websiteType}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(historyItem.extractedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Extracted Content */}
      {extractedContent && (
        <div className="flex flex-col gap-3">
          {/* Title */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-white leading-tight">
                {extractedContent.title}
              </h2>
              <button
                onClick={async () => {
                  const tab = await TabService.getActiveTab();
                  if (tab?.id) {
                    await TabService.injectReaderModal(
                      tab.id,
                      extractedContent.title,
                      extractedContent.content
                    );
                    window.close(); // Close extension popup to reveal the host page modal
                  }
                }}
                className="shrink-0 flex items-center gap-1.5 rounded bg-blue-600/20 px-2.5 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-600/30 hover:text-blue-300"
                title="Read in Full Screen on the Webpage"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Read Full
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                {extractedContent.websiteType}
              </span>
              <span className="text-[10px] text-neutral-500">
                {extractedContent.sections.length} sections
              </span>
              <span className="text-[10px] text-neutral-500">•</span>
              <span className="text-[10px] text-neutral-500">
                {new Date(extractedContent.extractedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Sections */}
          {extractedContent.sections.length > 0 ? (
            extractedContent.sections.map((section, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
              >
                {section.heading && (
                  <h3 className="mb-1.5 text-sm font-semibold text-neutral-200">
                    {section.heading}
                  </h3>
                )}
                {section.text && (
                  <p className="text-xs leading-relaxed text-neutral-400 whitespace-pre-wrap">
                    {section.text.length > 500
                      ? `${section.text.slice(0, 500)}…`
                      : section.text}
                  </p>
                )}
              </div>
            ))
          ) : (
            /* Full text fallback if no sections were parsed */
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <p className="text-xs leading-relaxed text-neutral-400 whitespace-pre-wrap">
                {extractedContent.content.length > 2000
                  ? `${extractedContent.content.slice(0, 2000)}…`
                  : extractedContent.content}
              </p>
            </div>
          )}

          {/* AI Q&A Chat */}
          <ContentChat />

          {/* Action Buttons */}
          <div className="flex gap-2 w-full mt-1">
            <ScreenReaderButton />
            <CopyJsonButton content={extractedContent} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Copies the extracted content as JSON to the clipboard.
 */
function CopyJsonButton({
  content,
}: {
  content: { title: string; content: string; sections: { heading: string; text: string }[] };
}) {
  const handleCopy = async () => {
    const json = JSON.stringify(
      {
        title: content.title,
        content: content.content,
        sections: content.sections,
      },
      null,
      2,
    );

    try {
      await navigator.clipboard.writeText(json);
    } catch {
      // Fallback for extension context where clipboard API may be restricted
      const textarea = document.createElement("textarea");
      textarea.value = json;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <button
      onClick={handleCopy}
      id="copy-json-btn"
      className="flex items-center justify-center gap-1.5 rounded border border-neutral-700 px-3 py-2 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      Copy as JSON
    </button>
  );
}
