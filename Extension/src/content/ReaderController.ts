import { HighlightManager, type ReadItem } from "./HighlightManager";

export type ReaderState = "stopped" | "playing" | "paused";

export class ReaderController {
  private static instance: ReaderController | null = null;

  private items: ReadItem[] = [];
  private currentIndex: number = 0;
  private state: ReaderState = "stopped";
  private speed: number = 1.0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStateChangeCallback: ((state: ReaderState, progress: number, timeRemaining: string) => void) | null = null;

  static getInstance(): ReaderController {
    if (!this.instance) {
      this.instance = new ReaderController();
    }
    return this.instance;
  }

  private constructor() {
    // Stop speech if window unloading
    window.addEventListener("beforeunload", () => {
      this.stop();
    });
  }

  /**
   * Registers a listener to receive state updates (playing/paused/stopped, progress, time remaining).
   */
  subscribe(callback: (state: ReaderState, progress: number, timeRemaining: string) => void) {
    this.onStateChangeCallback = callback;
    this.notify();
  }

  unsubscribe() {
    this.onStateChangeCallback = null;
  }

  /**
   * Initializes the reader with items parsed from the webpage.
   */
  loadPageContent(mode: "all" | "selection" | "section" = "all") {
    this.stop();
    const allItems = HighlightManager.parsePage();

    if (mode === "selection") {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const selectionRange = selection.getRangeAt(0);
        this.items = allItems.filter(item => {
          try {
            // Check if the item's range intersects the selection range
            return (
              item.range.compareBoundaryPoints(Range.END_TO_START, selectionRange) < 0 &&
              item.range.compareBoundaryPoints(Range.START_TO_END, selectionRange) > 0
            );
          } catch (e) {
            return false;
          }
        });
      } else {
        this.items = allItems;
      }
      this.currentIndex = 0;
    } else if (mode === "section") {
      this.items = allItems;
      // Find the sentence closest to center of viewport
      let closestIndex = 0;
      let minDiff = Infinity;
      const centerY = window.innerHeight / 2;

      allItems.forEach((item, index) => {
        try {
          const rect = item.range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const itemCenterY = rect.top + rect.height / 2;
            const diff = Math.abs(itemCenterY - centerY);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = index;
            }
          }
        } catch (e) {}
      });

      this.currentIndex = closestIndex;
    } else {
      this.items = allItems;
      this.currentIndex = 0;
    }

    this.notify();
  }

  /**
   * Load custom items directly (e.g. read important points summary).
   */
  loadCustomItems(texts: string[]) {
    this.stop();
    
    // Create dummy container/range for custom texts since they aren't on the DOM
    this.items = texts.map(text => {
      const range = document.createRange();
      return {
        text,
        range,
        container: document.body,
      };
    });

    this.currentIndex = 0;
    this.notify();
  }

  /**
   * Starts playing from the current index.
   */
  play() {
    if (this.items.length === 0) {
      this.loadPageContent();
    }

    if (this.items.length === 0) return;

    window.speechSynthesis.cancel(); // Reset any stuck speech
    this.state = "playing";
    this.speakCurrent();
  }

  /**
   * Pauses the reading session.
   */
  pause() {
    if (this.state !== "playing") return;
    window.speechSynthesis.pause();
    this.state = "paused";
    this.notify();
  }

  /**
   * Resumes the reading session.
   */
  resume() {
    if (this.state !== "paused") return;
    window.speechSynthesis.resume();
    this.state = "playing";
    this.notify();
  }

  /**
   * Stops the reading session completely.
   */
  stop() {
    window.speechSynthesis.cancel();
    HighlightManager.clearHighlight();
    this.state = "stopped";
    this.notify();
  }

  next() {
    if (this.currentIndex < this.items.length - 1) {
      window.speechSynthesis.cancel();
      this.currentIndex++;
      if (this.state === "playing") {
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      window.speechSynthesis.cancel();
      this.currentIndex--;
      if (this.state === "playing") {
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  setSpeed(rate: number) {
    this.speed = rate;
    if (this.state === "playing") {
      window.speechSynthesis.cancel();
      this.speakCurrent();
    } else {
      this.notify();
    }
  }

  getSpeed(): number {
    return this.speed;
  }

  getState(): ReaderState {
    return this.state;
  }

  /**
   * Speaks the current sentence item.
   */
  private speakCurrent() {
    if (this.currentIndex >= this.items.length) {
      this.stop();
      return;
    }

    const item = this.items[this.currentIndex];
    if (!item) {
      this.stop();
      return;
    }

    // Highlight and Scroll to sentence range (only if range is bound to DOM)
    if (item.range.startContainer !== document) {
      HighlightManager.highlightRange(item.range);
      HighlightManager.scrollToRange(item.range);
    }

    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = this.speed;
    this.currentUtterance = utterance;

    // Detect language of the item to bind a suitable voice
    const lang = this.detectLanguageSimple(item.text);
    utterance.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-US";

    utterance.onend = () => {
      if (this.state === "playing" && this.currentUtterance === utterance) {
        this.currentIndex++;
        this.speakCurrent();
      }
    };

    utterance.onerror = (e) => {
      // In Chrome, cancel() triggers onerror callback with error code 'interrupted'
      if (e.error !== "interrupted" && this.state === "playing" && this.currentUtterance === utterance) {
        console.error("[ReaderController] Utterance error:", e);
        this.currentIndex++;
        this.speakCurrent();
      }
    };

    window.speechSynthesis.speak(utterance);
    this.notify();
  }

  /**
   * Quick character pattern check for Devanagari (Hindi/Marathi)
   */
  private detectLanguageSimple(text: string): "en" | "hi" | "mr" {
    const devanagariRegex = /[\u0900-\u097F]/;
    if (!devanagariRegex.test(text)) return "en";
    
    // Quick heuristic: common Marathi helper words
    const marathiWords = /\b(आहे|आहेत|केला|केली|करून|होता|होती|पण|आणि)\b/i;
    return marathiWords.test(text) ? "mr" : "hi";
  }

  /**
   * Computes estimated remaining reading time.
   */
  private calculateRemainingTime(): string {
    if (this.items.length === 0 || this.currentIndex >= this.items.length) {
      return "0:00";
    }

    // Average reading speed: 180 words per minute
    const wpm = 180 * this.speed;
    
    let wordsRemaining = 0;
    for (let i = this.currentIndex; i < this.items.length; i++) {
      const item = this.items[i];
      if (item) {
        wordsRemaining += item.text.split(/\s+/).length;
      }
    }

    const totalSeconds = Math.ceil((wordsRemaining / wpm) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  /**
   * Notifies subscribers of status changes.
   */
  private notify() {
    if (!this.onStateChangeCallback) return;

    const progress = this.items.length > 0 
      ? Math.round((this.currentIndex / this.items.length) * 100) 
      : 0;

    const timeRemaining = this.calculateRemainingTime();
    this.onStateChangeCallback(this.state, progress, timeRemaining);
  }
}
