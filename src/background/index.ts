// LSCS v2 — Background Service Worker
import { routeMessage } from "./router";
import type { RuntimeRequest, RuntimeResponse } from "../services";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[LSCS] Extension installed.");
  }

  if (details.reason === "update") {
    console.log(
      "[LSCS] Extension updated to version:",
      chrome.runtime.getManifest().version,
    );
  }
});

chrome.runtime.onMessage.addListener(
  (
    request: RuntimeRequest,
    sender,
    sendResponse: (response: RuntimeResponse) => void,
  ) => {
    // Fire and forget routing, but return true to keep sendResponse channel open
    routeMessage(request, sender, sendResponse);
    return true;
  },
);

console.log("[LSCS] Background service worker started.");
