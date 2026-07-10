import { useContentStore, type SmartMode } from "../stores";

interface ModeInfo {
  id: SmartMode;
  title: string;
  icon: string;
  description: string;
}

const MODES: ModeInfo[] = [
  {
    id: "student",
    title: "Student",
    icon: "🎓",
    description: "Learn the page in the easiest way.",
  },
  {
    id: "research",
    title: "Research",
    icon: "🔬",
    description: "Analyze the page deeply.",
  },
  {
    id: "summary",
    title: "Quick Summary",
    icon: "⚡",
    description: "Get the fastest overview.",
  },
];

export function SmartModes() {
  const { smartMode, setSmartMode } = useContentStore();

  const handleToggle = (modeId: SmartMode) => {
    // If clicking the already active mode, disable it. Otherwise, set it as active.
    if (smartMode === modeId) {
      setSmartMode(null);
    } else {
      setSmartMode(modeId);
    }
  };

  const activeModeObj = MODES.find((m) => m.id === smartMode);

  return (
    <div className="my-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Smart AI Modes
        </h3>
        {activeModeObj && (
          <div className="flex items-center gap-1.5 rounded-full bg-violet-900/40 border border-violet-700/50 px-2 py-0.5 animate-in fade-in zoom-in">
            <span className="text-[10px] text-violet-300">
              Current Mode: <span className="font-bold">{activeModeObj.icon} {activeModeObj.title}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full overflow-x-auto pb-1 custom-scrollbar">
        {MODES.map((mode) => {
          const isActive = smartMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => handleToggle(mode.id)}
              className={`flex-1 min-w-[100px] flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all duration-300 ${
                isActive
                  ? "border-violet-500 bg-violet-900/20 shadow-md shadow-violet-900/10 scale-[1.02]"
                  : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{mode.icon}</span>
                <span className={`text-[11px] font-bold ${isActive ? "text-violet-300" : "text-neutral-200"}`}>
                  {mode.title}
                </span>
              </div>
              <span className={`text-[9px] leading-tight ${isActive ? "text-violet-400/80" : "text-neutral-500"}`}>
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
