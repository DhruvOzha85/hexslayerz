import { useState } from "react";

export const PermissionsApp = () => {
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  const requestPermission = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus("granted");
      
      // Auto-close the tab after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (err) {
      console.error("Permission request failed:", err);
      setStatus("denied");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans text-neutral-200">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-blue-500/10 p-4">
            <svg
              className="h-10 w-10 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          Microphone Access Required
        </h1>
        
        <p className="mb-8 text-center text-sm leading-relaxed text-neutral-400">
          To use the "Ask AI" voice feature, LSCS needs your permission to use the microphone.
          This permission only needs to be granted once.
        </p>

        {status === "idle" && (
          <button
            onClick={requestPermission}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Grant Microphone Access
          </button>
        )}

        {status === "granted" && (
          <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
            <p className="font-medium text-emerald-400">
              ✓ Permission Granted!
            </p>
            <p className="mt-1 text-xs text-emerald-500/80">
              You can now close this tab and return to the extension.
            </p>
          </div>
        )}

        {status === "denied" && (
          <div className="rounded-lg bg-red-500/10 p-4 text-center">
            <p className="font-medium text-red-400">
              ✕ Permission Denied
            </p>
            <p className="mt-1 text-xs text-red-400/80">
              You denied access. Please click the site settings icon in your URL bar to allow it, then reload the extension.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
