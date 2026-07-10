import { useCheckpointStore } from "../stores";

type ViewType = "checkpoints" | "content" | "settings";

interface Props {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export function Header({ activeView, setActiveView }: Props) {
  const { createCheckpoint, loadCheckpoints, isLoading } = useCheckpointStore();

  const subtitleMap: Record<ViewType, string> = {
    checkpoints: "Checkpoint Manager",
    content: "Content Extractor",
    settings: "Settings",
  };

  return (
    <div className="flex items-center justify-between pb-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tighter">Context(AI)</h1>
        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-0.5">{subtitleMap[activeView]}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Help / Guide Button */}
        <button
          onClick={() => window.dispatchEvent(new Event("open-onboarding"))}
          className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          title="How to use"
          aria-label="How to use"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {/* Content Extractor Tab */}
        <button
          onClick={() =>
            setActiveView(activeView === "content" ? "checkpoints" : "content")
          }
          className={`rounded p-2 transition-colors ${
            activeView === "content"
              ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          }`}
          title={
            activeView === "content"
              ? "Back to Checkpoints"
              : "Open Content Extractor"
          }
          aria-label={
            activeView === "content"
              ? "Back to Checkpoints"
              : "Open Content Extractor"
          }
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() =>
            setActiveView(
              activeView === "settings" ? "checkpoints" : "settings",
            )
          }
          className={`rounded p-2 transition-colors ${
            activeView === "settings"
              ? "bg-blue-900/50 text-blue-400 hover:bg-blue-900/70"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          }`}
          title={
            activeView === "settings" ? "Back to Checkpoints" : "Open Settings"
          }
          aria-label={
            activeView === "settings" ? "Back to Checkpoints" : "Open Settings"
          }
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {activeView === "checkpoints" && (
          <button
            onClick={loadCheckpoints}
            disabled={isLoading}
            title="Refresh Checkpoints"
            aria-label="Refresh Checkpoints"
            className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {activeView === "checkpoints" && (
          <button
            onClick={() => createCheckpoint()}
            disabled={isLoading}
            aria-label="Extract Checkpoint"
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-violet-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-violet-600 disabled:hover:scale-100 shadow-lg shadow-violet-900/20"
          >
            {isLoading ? "Extracting..." : "Extract Checkpoint"}
          </button>
        )}
      </div>
    </div>
  );
}

