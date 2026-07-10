import { ChromeService } from "./ChromeService";

export class TabService {
  /**
   * Retrieves the currently active tab in the current window.
   */
  static async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    ChromeService.validateEnvironment();
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? null;
  }

  /**
   * Sends a message to the specified tab.
   */
  static async sendMessageToTab<TRequest, TResponse>(
    tabId: number,
    request: TRequest,
  ): Promise<TResponse> {
    ChromeService.validateEnvironment();
    return await chrome.tabs.sendMessage(tabId, request);
  }

  /**
   * Instructs the content script to find and scroll to the given text on the page.
   */
  static async scrollToText(tabId: number, text: string): Promise<void> {
    ChromeService.validateEnvironment();
    await chrome.tabs.sendMessage(tabId, {
      type: "SCROLL_TO_TEXT",
      payload: { text },
    });
  }

  /**
   * Validates if the given URL is a ChatGPT URL.
   */
  static isChatGPT(url: string | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      return (
        host === "chatgpt.com" ||
        host === "www.chatgpt.com" ||
        host === "chat.openai.com"
      );
    } catch {
      return false;
    }
  }

  /**
   * Injects a Shadow DOM reader modal into the host page.
   */
  static async injectReaderModal(
    tabId: number,
    title: string,
    content: string,
  ): Promise<void> {
    ChromeService.validateEnvironment();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (titleStr: string, contentStr: string) => {
        const MODAL_ID = "context-ai-reader-modal-root";
        let modalContainer = document.getElementById(MODAL_ID);
        if (modalContainer) {
          modalContainer.remove();
        }

        modalContainer = document.createElement("div");
        modalContainer.id = MODAL_ID;
        modalContainer.style.position = "fixed";
        modalContainer.style.zIndex = "2147483647"; // Max z-index
        modalContainer.style.top = "0";
        modalContainer.style.left = "0";
        modalContainer.style.width = "100%";
        modalContainer.style.height = "100%";
        document.body.appendChild(modalContainer);

        const shadow = modalContainer.attachShadow({ mode: "closed" });

        const style = document.createElement("style");
        style.textContent = `
          :host {
            all: initial;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            box-sizing: border-box;
            animation: fadeIn 0.2s ease-out;
          }
          .modal {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .header {
            padding: 1.5rem;
            border-bottom: 1px solid #334155;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: #0f172a;
          }
          .title {
            color: #f8fafc;
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            line-height: 1.3;
          }
          .close-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            margin: -0.5rem -0.5rem 0 1rem;
            border-radius: 4px;
            transition: color 0.2s, background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .close-btn:hover {
            color: #f8fafc;
            background: #334155;
          }
          .content {
            padding: 2rem;
            overflow-y: auto;
            color: #cbd5e1;
            font-size: 1.125rem;
            line-height: 1.75;
            white-space: pre-wrap;
          }
          .content::-webkit-scrollbar {
            width: 8px;
          }
          .content::-webkit-scrollbar-track {
            background: #1e293b;
          }
          .content::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 4px;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `;

        const overlay = document.createElement("div");
        overlay.className = "overlay";
        
        const modal = document.createElement("div");
        modal.className = "modal";
        
        const header = document.createElement("div");
        header.className = "header";
        
        const h1 = document.createElement("h1");
        h1.className = "title";
        h1.textContent = titleStr;
        
        const closeBtn = document.createElement("button");
        closeBtn.className = "close-btn";
        closeBtn.innerHTML = "✕";
        closeBtn.ariaLabel = "Close modal";
        
        header.appendChild(h1);
        header.appendChild(closeBtn);
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "content";
        contentDiv.textContent = contentStr;
        
        modal.appendChild(header);
        modal.appendChild(contentDiv);
        overlay.appendChild(modal);
        
        shadow.appendChild(style);
        shadow.appendChild(overlay);

        // Click outside to close
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            modalContainer?.remove();
          }
        });

        // Click X to close
        closeBtn.addEventListener("click", () => {
          modalContainer?.remove();
        });

        // Escape to close
        const escapeListener = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            modalContainer?.remove();
            document.removeEventListener("keydown", escapeListener);
          }
        };
        document.addEventListener("keydown", escapeListener);
      },
      args: [title, content],
    });
  }
}
