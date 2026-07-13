export class VoiceOutput {
  /**
   * Speaks the given text aloud by injecting the speech synthesis command into the active tab.
   * This ensures it works correctly even when called from the background service worker.
   */
  static async speak(tabId: number, text: string, langCode: string = 'en-US') {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: (txt: string, lang: string) => {
          if (!window.speechSynthesis) {
            console.warn("Speech Synthesis not supported in this browser.");
            return;
          }
          window.speechSynthesis.cancel(); // Stop any ongoing speech
          
          const utterance = new SpeechSynthesisUtterance(txt);
          const voices = window.speechSynthesis.getVoices();
          const matchingVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0] || 'en'));
          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
          window.speechSynthesis.speak(utterance);
        },
        args: [text, langCode]
      });
    } catch (e) {
      console.warn("Failed to execute voice output in tab:", e);
    }
  }

  /**
   * Stops ongoing speech.
   */
  static async stop(tabId: number) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: () => {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
        }
      });
    } catch (e) {}
  }

  /**
   * Pauses ongoing speech.
   */
  static async pause(tabId: number) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: () => {
          if (window.speechSynthesis && window.speechSynthesis.speaking) window.speechSynthesis.pause();
        }
      });
    } catch (e) {}
  }

  /**
   * Resumes paused speech.
   */
  static async resume(tabId: number) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: () => {
          if (window.speechSynthesis && window.speechSynthesis.paused) window.speechSynthesis.resume();
        }
      });
    } catch (e) {}
  }
}
