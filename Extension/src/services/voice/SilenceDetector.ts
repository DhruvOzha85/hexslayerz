export class SilenceDetector {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private durationMs: number;

  constructor(durationMs: number = 1500) {
    this.durationMs = durationMs;
  }

  /**
   * Starts the silence timer. Triggers the callback if no new input occurs.
   */
  start(onSilence: () => void) {
    this.clear();
    this.timeoutId = setTimeout(() => {
      onSilence();
    }, this.durationMs);
  }

  /**
   * Clears any active silence timer.
   */
  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
