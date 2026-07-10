export class ChromeService {
  /**
   * Checks if the code is running in a Chrome Extension environment.
   */
  static get isExtensionEnvironment(): boolean {
    return typeof chrome !== "undefined" && !!chrome.runtime;
  }

  /**
   * Throws an error if the Chrome extension environment is not available.
   * Useful for failing fast in unsupported contexts.
   */
  static validateEnvironment(): void {
    if (!this.isExtensionEnvironment) {
      throw new Error("Chrome extension environment is not available.");
    }
  }
}
