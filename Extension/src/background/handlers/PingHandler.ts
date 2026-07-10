import type { RuntimeRequest, RuntimeResponse } from "../../services";

export const handlePing = async (
  _request: RuntimeRequest,
  sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> => {
  console.log(
    "[PingHandler] Received PING from:",
    sender.tab ? "content script" : "popup",
  );
  return { success: true, data: "PONG" };
};
