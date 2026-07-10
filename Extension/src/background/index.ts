// Context(AI) — Background Service Worker
import { routeMessage } from "./router";
import type { RuntimeRequest, RuntimeResponse } from "../services";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[Context(AI)] Extension installed.");
  }

  if (details.reason === "update") {
    console.log(
      "[Context(AI)] Extension updated to version:",
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

console.log("[Context(AI)] Background service worker started.");
