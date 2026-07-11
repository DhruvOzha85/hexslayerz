import { ReaderController, type ReaderState } from "./ReaderController";

export class FloatingUI {
  private static menu: HTMLDivElement | null = null;
  private static card: HTMLDivElement | null = null;
  private static toolbar: HTMLDivElement | null = null;
  private static activeSelectionText: string = "";
  
  private static isCardSpeaking: boolean = false;

  /**
   * Inject CSS styles into the host page.
   */
  static injectStyles() {
    if (document.getElementById("context-ai-floating-styles")) return;

    const style = document.createElement("style");
    style.id = "context-ai-floating-styles";
    style.textContent = `
      /* Common Variables & Reset */
      .context-ai-widget {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #f3f4f6;
        z-index: 999999;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .context-ai-widget * {
        box-sizing: border-box;
      }

      /* Floating Action Selection Menu */
      #context-ai-floating-menu {
        position: absolute;
        display: flex;
        background: rgba(17, 12, 28, 0.9);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 24px;
        padding: 4px 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.15);
        gap: 4px;
        pointer-events: auto;
      }
      .context-ai-btn {
        background: transparent;
        border: none;
        color: #d1d5db;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }
      .context-ai-btn:hover {
        background: rgba(139, 92, 246, 0.2);
        color: #ffffff;
      }
      .context-ai-btn-accent {
        color: #a78bfa;
      }
      .context-ai-btn-accent:hover {
        background: rgb(124, 58, 237);
        color: #ffffff;
      }

      /* Explanation Card */
      #context-ai-explanation-card {
        position: absolute;
        width: 320px;
        max-height: 400px;
        background: rgba(15, 11, 25, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(139, 92, 246, 0.25);
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 25px rgba(139, 92, 246, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .context-ai-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: rgba(124, 58, 237, 0.1);
        border-bottom: 1px solid rgba(139, 92, 246, 0.15);
      }
      .context-ai-card-title {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #a78bfa;
      }
      .context-ai-card-body {
        padding: 14px;
        font-size: 13px;
        line-height: 1.5;
        overflow-y: auto;
        color: #e5e7eb;
        flex: 1;
      }
      .context-ai-card-body p {
        margin: 0 0 10px 0;
      }
      .context-ai-card-body p:last-child {
        margin-bottom: 0;
      }
      .context-ai-card-actions {
        display: flex;
        justify-content: flex-end;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid rgba(139, 92, 246, 0.1);
        gap: 6px;
      }
      .context-ai-icon-btn {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      .context-ai-icon-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }
      .context-ai-icon-btn-active {
        color: #a78bfa;
        background: rgba(139, 92, 246, 0.15);
      }

      /* Loader */
      .context-ai-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 30px 0;
        color: #9ca3af;
      }
      .context-ai-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(139, 92, 246, 0.2);
        border-top: 2px solid #8b5cf6;
        border-radius: 50%;
        animation: context-ai-spin 0.8s linear infinite;
      }
      @keyframes context-ai-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Read Mode Bottom Toolbar */
      #context-ai-reader-toolbar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 480px;
        background: rgba(15, 11, 25, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(139, 92, 246, 0.25);
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15);
        padding: 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .context-ai-toolbar-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .context-ai-toolbar-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .context-ai-toolbar-progress-container {
        flex: 1;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }
      .context-ai-toolbar-progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #7c3aed, #ec4899);
        transition: width 0.3s ease;
      }
      .context-ai-toolbar-stats {
        font-size: 11px;
        color: #9ca3af;
        font-weight: 500;
      }
      .context-ai-speed-select {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #f3f4f6;
        font-size: 11px;
        padding: 4px 8px;
        cursor: pointer;
        outline: none;
      }
      .context-ai-speed-select:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initializes event listeners on the webpage.
   */
  static init() {
    this.injectStyles();

    // Listen for text selection
    document.addEventListener("mouseup", (e) => this.handleTextSelection(e));
    document.addEventListener("keyup", (e) => this.handleTextSelection(e));

    // Dismiss widgets on click outside
    document.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement;
      if (this.menu && !this.menu.contains(target)) {
        this.hideMenu();
      }
      if (this.card && !this.card.contains(target)) {
        this.hideCard();
      }
    });

    // Subscribe to reader updates
    ReaderController.getInstance().subscribe((state, progress, timeRemaining) => {
      this.updateToolbarUI(state, progress, timeRemaining);
    });
  }

  /**
   * Detects selection changes and displays selection menu.
   */
  private static handleTextSelection(e: Event) {
    // Avoid triggering menu when clicking elements inside our widgets
    const target = e.target as HTMLElement;
    if (target.closest(".context-ai-widget")) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (text && text.length > 2) {
        this.activeSelectionText = text;
        this.showMenuAtSelection();
      } else {
        this.hideMenu();
      }
    }, 10);
  }

  /**
   * Shows selection menu above selection range.
   */
  private static showMenuAtSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (!this.menu) {
      this.menu = document.createElement("div");
      this.menu.id = "context-ai-floating-menu";
      this.menu.className = "context-ai-widget";
      document.body.appendChild(this.menu);
    }

    this.menu.innerHTML = `
      <button class="context-ai-btn context-ai-btn-accent" data-action="explain">
        ✨ Explain
      </button>
      <button class="context-ai-btn" data-action="simplify">
        🧠 Simplify
      </button>
      <button class="context-ai-btn" data-action="example">
        💡 Example
      </button>
      <button class="context-ai-btn" data-action="translate-menu">
        🌐 Translate
      </button>
      <button class="context-ai-btn" data-action="read">
        🔊 Read
      </button>
    `;

    // Calculate position
    const menuWidth = 340;
    const menuHeight = 36;
    const top = rect.top + window.scrollY - menuHeight - 8;
    const left = Math.max(8, rect.left + window.scrollX + (rect.width - menuWidth) / 2);

    this.menu.style.top = `${top}px`;
    this.menu.style.left = `${left}px`;
    this.menu.style.display = "flex";
    this.menu.style.opacity = "1";

    // Bind button listeners
    this.menu.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        if (action) this.handleMenuAction(action, rect);
      });
    });
  }

  private static hideMenu() {
    if (this.menu) {
      this.menu.style.display = "none";
      this.menu.style.opacity = "0";
    }
  }

  /**
   * Performs the selected action.
   */
  private static handleMenuAction(action: string, rect: DOMRect) {
    this.hideMenu();

    if (action === "read") {
      ReaderController.getInstance().loadPageContent("selection");
      this.showToolbar();
      ReaderController.getInstance().play();
      return;
    }

    if (action === "translate-menu") {
      // Render languages selection in menu container instead
      if (this.menu) {
        this.menu.innerHTML = `
          <button class="context-ai-btn" data-lang="English">English</button>
          <button class="context-ai-btn" data-lang="Hindi">Hindi</button>
          <button class="context-ai-btn" data-lang="Marathi">Marathi</button>
        `;
        this.menu.querySelectorAll("button").forEach(langBtn => {
          langBtn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = langBtn.getAttribute("data-lang");
            if (lang) {
              this.hideMenu();
              this.triggerAIAction("translate", rect, lang);
            }
          });
        });
      }
      return;
    }

    this.triggerAIAction(action, rect);
  }

  /**
   * Shows explanation popover and fetches response from background AI.
   */
  private static async triggerAIAction(mode: string, rect: DOMRect, targetLang?: string) {
    if (!this.card) {
      this.card = document.createElement("div");
      this.card.id = "context-ai-explanation-card";
      this.card.className = "context-ai-widget";
      document.body.appendChild(this.card);
    }

    // Set position near selection
    const cardWidth = 320;
    const cardHeight = 240;
    let top = rect.bottom + window.scrollY + 8;
    const left = Math.min(window.innerWidth - cardWidth - 16, Math.max(16, rect.left + window.scrollX + (rect.width - cardWidth) / 2));

    // If card flows off-screen bottom, position it above selection instead
    if (rect.bottom + cardHeight > window.innerHeight) {
      top = rect.top + window.scrollY - cardHeight - 8;
    }

    this.card.style.top = `${top}px`;
    this.card.style.left = `${left}px`;
    this.card.style.display = "flex";
    this.card.style.opacity = "1";

    // Show loading spinner
    this.card.innerHTML = `
      <div class="context-ai-card-header">
        <span class="context-ai-card-title">${mode.replace("-", " ")}</span>
        <button class="context-ai-icon-btn" id="context-ai-close-card">✕</button>
      </div>
      <div class="context-ai-card-body">
        <div class="context-ai-loader">
          <div class="context-ai-spinner"></div>
          <span>Asking AI...</span>
        </div>
      </div>
    `;

    this.card.querySelector("#context-ai-close-card")?.addEventListener("click", () => this.hideCard());

    try {
      const response = await chrome.runtime.sendMessage({
        type: "EXPLAIN_TEXT",
        payload: {
          text: this.activeSelectionText,
          mode,
          targetLang
        }
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to query AI");
      }

      this.renderCardContent(response.data, mode);
    } catch (err: any) {
      this.card.querySelector(".context-ai-card-body")!.innerHTML = `
        <div style="color: #ef4444; text-align: center; padding: 10px 0;">
          Error: ${err.message || "Failed to reach AI. Ensure your API Key is set in the popup settings."}
        </div>
      `;
    }
  }

  private static renderCardContent(content: any, title: string) {
    if (!this.card) return;

    // Safely cast to string to prevent split is not a function errors
    const textContent = typeof content === "string" 
      ? content 
      : (content && typeof content === "object" ? JSON.stringify(content) : String(content || ""));

    // Convert markdown paragraphs into basic paragraphs for the injected body
    const formatted = textContent
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`)
      .join("");

    this.card.innerHTML = `
      <div class="context-ai-card-header">
        <span class="context-ai-card-title">${title.replace("-", " ")}</span>
        <button class="context-ai-icon-btn" id="context-ai-close-card">✕</button>
      </div>
      <div class="context-ai-card-body">
        ${formatted}
      </div>
      <div class="context-ai-card-actions">
        <button class="context-ai-icon-btn" id="context-ai-card-speak" title="Read explanation aloud">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <button class="context-ai-icon-btn" id="context-ai-card-copy" title="Copy to clipboard">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
      </div>
    `;

    // Listeners
    this.card.querySelector("#context-ai-close-card")?.addEventListener("click", () => this.hideCard());

    this.card.querySelector("#context-ai-card-copy")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(content);
      const copyBtn = this.card?.querySelector("#context-ai-card-copy") as HTMLButtonElement;
      copyBtn.innerHTML = "✓";
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        `;
      }, 1500);
    });

    this.card.querySelector("#context-ai-card-speak")?.addEventListener("click", () => {
      this.toggleCardSpeech(content);
    });
  }

  private static toggleCardSpeech(text: string) {
    if (this.isCardSpeaking) {
      window.speechSynthesis.cancel();
      this.isCardSpeaking = false;
      this.card?.querySelector("#context-ai-card-speak")?.classList.remove("context-ai-icon-btn-active");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    this.isCardSpeaking = true;
    this.card?.querySelector("#context-ai-card-speak")?.classList.add("context-ai-icon-btn-active");

    utterance.onend = () => {
      this.isCardSpeaking = false;
      this.card?.querySelector("#context-ai-card-speak")?.classList.remove("context-ai-icon-btn-active");
    };
    utterance.onerror = () => {
      this.isCardSpeaking = false;
      this.card?.querySelector("#context-ai-card-speak")?.classList.remove("context-ai-icon-btn-active");
    };

    window.speechSynthesis.speak(utterance);
  }

  private static hideCard() {
    if (this.card) {
      this.card.style.display = "none";
      this.card.style.opacity = "0";
    }
    if (this.isCardSpeaking) {
      window.speechSynthesis.cancel();
      this.isCardSpeaking = false;
    }
  }

  /**
   * Displays the player toolbar.
   */
  static showToolbar() {
    if (!this.toolbar) {
      this.toolbar = document.createElement("div");
      this.toolbar.id = "context-ai-reader-toolbar";
      this.toolbar.className = "context-ai-widget";
      document.body.appendChild(this.toolbar);
    }

    this.toolbar.style.display = "flex";
    this.toolbar.style.opacity = "1";
    this.renderToolbarUI();
  }

  static hideToolbar() {
    if (this.toolbar) {
      this.toolbar.style.display = "none";
      this.toolbar.style.opacity = "0";
    }
  }

  /**
   * Renders static controls.
   */
  private static renderToolbarUI() {
    if (!this.toolbar) return;

    this.toolbar.innerHTML = `
      <div class="context-ai-toolbar-row">
        <div class="context-ai-toolbar-controls">
          <button class="context-ai-icon-btn" id="context-ai-tb-prev" title="Previous Sentence">⏮</button>
          <button class="context-ai-icon-btn" id="context-ai-tb-play" style="font-size: 16px;" title="Play">▶</button>
          <button class="context-ai-icon-btn" id="context-ai-tb-next" title="Next Sentence">⏭</button>
          <button class="context-ai-icon-btn" id="context-ai-tb-stop" title="Stop & Close">⏹</button>
        </div>
        
        <div class="context-ai-toolbar-controls">
          <button class="context-ai-btn" id="context-ai-tb-summary" style="font-size: 11px;">📝 Summarize Page</button>
          <select class="context-ai-speed-select" id="context-ai-tb-speed">
            <option value="0.75">0.75x</option>
            <option value="1.0" selected>1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>
      </div>
      
      <div class="context-ai-toolbar-row" style="margin-top: 4px;">
        <div class="context-ai-toolbar-progress-container">
          <div class="context-ai-toolbar-progress-bar" id="context-ai-tb-progress-bar"></div>
        </div>
        <span class="context-ai-toolbar-stats" id="context-ai-tb-stats">0% (0:00 remaining)</span>
      </div>
    `;

    // Button actions
    const controller = ReaderController.getInstance();

    this.toolbar.querySelector("#context-ai-tb-play")?.addEventListener("click", () => {
      const state = controller.getState();
      if (state === "playing") {
        controller.pause();
      } else if (state === "paused") {
        controller.resume();
      } else {
        controller.play();
      }
    });

    this.toolbar.querySelector("#context-ai-tb-stop")?.addEventListener("click", () => {
      controller.stop();
      this.hideToolbar();
    });

    this.toolbar.querySelector("#context-ai-tb-next")?.addEventListener("click", () => controller.next());
    this.toolbar.querySelector("#context-ai-tb-prev")?.addEventListener("click", () => controller.prev());

    this.toolbar.querySelector("#context-ai-tb-speed")?.addEventListener("change", (e) => {
      const val = parseFloat((e.target as HTMLSelectElement).value);
      controller.setSpeed(val);
    });

    this.toolbar.querySelector("#context-ai-tb-summary")?.addEventListener("click", async () => {
      const summaryBtn = this.toolbar?.querySelector("#context-ai-tb-summary") as HTMLButtonElement;
      summaryBtn.disabled = true;
      summaryBtn.textContent = "Summarizing...";

      try {
        let rootText = document.body.innerText || "";
        const main = document.querySelector("article, main, .markdown-body");
        if (main) rootText = (main as HTMLElement).innerText;

        const response = await chrome.runtime.sendMessage({
          type: "EXPLAIN_TEXT",
          payload: {
            text: rootText,
            mode: "simplify"
          }
        });

        if (!response.success) throw new Error(response.error);

        // Split AI response into individual bullet points safely
        const dataStr = typeof response.data === "string" ? response.data : String(response.data || "");
        const points = dataStr
          .split("\n")
          .map((p: string) => p.replace(/^[-*•\d.]+\s*/, "").trim())
          .filter((p: string) => p.length > 5);

        controller.loadCustomItems(points);
        controller.play();
        summaryBtn.textContent = "📝 Summarized!";
      } catch (err) {
        summaryBtn.textContent = "⚠️ Summary Failed";
      } finally {
        setTimeout(() => {
          if (summaryBtn) {
            summaryBtn.disabled = false;
            summaryBtn.textContent = "📝 Summarize Page";
          }
        }, 3000);
      }
    });
  }

  /**
   * Refreshes control icons and statistics (progress/time remaining).
   */
  private static updateToolbarUI(state: ReaderState, progress: number, timeRemaining: string) {
    if (!this.toolbar) return;

    const playBtn = this.toolbar.querySelector("#context-ai-tb-play") as HTMLButtonElement;
    if (playBtn) {
      playBtn.textContent = state === "playing" ? "⏸" : "▶";
      playBtn.title = state === "playing" ? "Pause" : "Play";
    }

    const progressBar = this.toolbar.querySelector("#context-ai-tb-progress-bar") as HTMLDivElement;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    const stats = this.toolbar.querySelector("#context-ai-tb-stats") as HTMLSpanElement;
    if (stats) {
      stats.textContent = `${progress}% (${timeRemaining} left)`;
    }
  }
}
