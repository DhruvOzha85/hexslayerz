import React, { useEffect } from "react";
import { useCheckpointStore } from "../stores";

export const Feedback = React.memo(function Feedback() {
  const { error, successMessage, clearError, clearSuccessMessage } =
    useCheckpointStore();

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(clearSuccessMessage, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [successMessage, clearSuccessMessage]);

  if (!error && !successMessage) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2">
      {error && (
        <div className="flex items-center justify-between rounded bg-red-900/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-4 text-red-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center justify-between rounded bg-green-900/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
          <span>{successMessage}</span>
          <button
            onClick={clearSuccessMessage}
            className="ml-4 text-green-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
});
