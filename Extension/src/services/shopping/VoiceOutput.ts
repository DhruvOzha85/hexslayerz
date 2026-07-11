export class VoiceOutput {
  private static isSpeaking = false;

  /**
   * Reads the given text aloud using the browser's speech synthesis API.
   * Allows specifying language to match the AI output.
   */
  static speak(text: string, language: "English" | "Hindi" | "Marathi" = "English") {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis API not supported in this browser.");
      return;
    }

    this.stop(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map languages to standard BCP 47 tags
    if (language === "Hindi") {
      utterance.lang = "hi-IN";
    } else if (language === "Marathi") {
      utterance.lang = "mr-IN";
    } else {
      utterance.lang = "en-US";
    }

    this.isSpeaking = true;

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      this.isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stops the current speech.
   */
  static stop() {
    if (window.speechSynthesis && this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Check if currently speaking
   */
  static isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}
