import { useCallback, useEffect, useState } from "react";
import { TabService } from "../services/chrome";
import { RuntimeMessageTypes } from "../services/runtime";

export function useRawPageReader() {
  const [isReadingActive, setIsReadingActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Sync state with active tab on mount
  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const tab = await TabService.getActiveTab();
        if (!tab?.id) return;

        const response = await TabService.sendMessageToTab<any, any>(tab.id, {
          type: RuntimeMessageTypes.GET_READ_MODE_STATUS,
        });

        if (active && response?.success && response.data) {
          setIsReadingActive(response.data.isReadingActive);
          setIsPaused(response.data.isPaused);
        }
      } catch (err) {
        // Content script might not be injected yet
      }
    };

    checkStatus();

    // Periodically poll for status updates while popup is open to keep in sync
    const interval = setInterval(checkStatus, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const startReading = useCallback(async (mode: "all" | "selection" | "section" | "summary" = "all") => {
    try {
      const tab = await TabService.getActiveTab();
      if (!tab?.id) throw new Error("No active tab found.");

      await TabService.sendMessageToTab<any, any>(tab.id, {
        type: RuntimeMessageTypes.START_PAGE_READ_MODE,
        payload: { mode }
      });

      setIsReadingActive(true);
      setIsPaused(false);
    } catch (error) {
      console.error("[useRawPageReader] Failed to start reading:", error);
    }
  }, []);

  const stopReading = useCallback(async () => {
    try {
      const tab = await TabService.getActiveTab();
      if (!tab?.id) return;

      await TabService.sendMessageToTab<any, any>(tab.id, {
        type: RuntimeMessageTypes.STOP_PAGE_READ_MODE,
      });

      setIsReadingActive(false);
      setIsPaused(false);
    } catch (error) {
      console.error("[useRawPageReader] Failed to stop reading:", error);
    }
  }, []);

  const pauseReading = useCallback(async () => {
    try {
      const tab = await TabService.getActiveTab();
      if (!tab?.id) return;

      await TabService.sendMessageToTab<any, any>(tab.id, {
        type: RuntimeMessageTypes.PAUSE_PAGE_READ_MODE,
      });

      setIsPaused(true);
    } catch (error) {
      console.error("[useRawPageReader] Failed to pause reading:", error);
    }
  }, []);

  const resumeReading = useCallback(async () => {
    try {
      const tab = await TabService.getActiveTab();
      if (!tab?.id) return;

      await TabService.sendMessageToTab<any, any>(tab.id, {
        type: RuntimeMessageTypes.RESUME_PAGE_READ_MODE,
      });

      setIsPaused(false);
    } catch (error) {
      console.error("[useRawPageReader] Failed to resume reading:", error);
    }
  }, []);

  const repeatLastSection = useCallback(async () => {
    try {
      const tab = await TabService.getActiveTab();
      if (!tab?.id) return;

      await TabService.sendMessageToTab<any, any>(tab.id, {
        type: RuntimeMessageTypes.REPEAT_LAST_SECTION,
      });
    } catch (error) {
      console.error("[useRawPageReader] Failed to repeat last section:", error);
    }
  }, []);

  return {
    startReading,
    stopReading,
    pauseReading,
    resumeReading,
    repeatLastSection,
    isReadingActive,
    isPaused,
  };
}
