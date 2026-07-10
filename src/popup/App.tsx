import { useEffect, useMemo, useState } from "react";
import { useCheckpointStore } from "../stores";
import { ApplicationService } from "../services";
import {
  Header,
  Controls,
  CheckpointList,
  Feedback,
  SettingsPanel,
  ContentView,
  OnboardingGuide,
} from "../components";

type ViewType = "checkpoints" | "content" | "settings";

function App() {
  const [activeView, setActiveView] = useState<ViewType>("checkpoints");

  const {
    checkpoints,
    loadCheckpoints,
    searchQuery,
    providerFilter,
    sortDirection,
  } = useCheckpointStore();

  // Load initial checkpoints on mount
  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  // Derive visible checkpoints through purely functional transformations
  const visibleCheckpoints = useMemo(() => {
    let result = checkpoints;

    if (providerFilter !== "ALL") {
      result = ApplicationService.filterByProvider(result, providerFilter);
    }

    if (searchQuery.trim() !== "") {
      result = ApplicationService.searchCheckpoints(result, searchQuery);
    }

    result = ApplicationService.sortByDate(result, sortDirection);

    return result;
  }, [checkpoints, providerFilter, searchQuery, sortDirection]);

  return (
    <div className="flex h-[600px] w-[400px] flex-col bg-black p-5 font-sans text-white tracking-tight">
      <OnboardingGuide />
      <Header activeView={activeView} setActiveView={setActiveView} />

      {activeView === "checkpoints" && (
        <>
          <div className="mb-4">
            <Controls />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <CheckpointList checkpoints={visibleCheckpoints} />
          </div>
        </>
      )}

      {activeView === "content" && (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <ContentView />
        </div>
      )}

      {activeView === "settings" && (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <SettingsPanel />
        </div>
      )}

      <Feedback />
    </div>
  );
}

export default App;
