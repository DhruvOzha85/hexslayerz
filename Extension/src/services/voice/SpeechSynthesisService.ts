// Context(AI) — Speech Synthesis Service

export class SpeechSynthesisService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isSpeaking = false;
  private static isPaused = false;
  private static bestVoice: SpeechSynthesisVoice | null = null;
  
  // @ts-expect-error Used internally to prevent Chrome garbage collection
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  
  // Listeners for UI updates
  private static stateListeners: Set<(isSpeaking: boolean, isPaused: boolean) => void> = new Set();

  static {
    // Attempt to load voices early
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.selectBestVoice();
      };
      this.selectBestVoice();
    }
  }

  private static selectBestVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Prefer Google US English, then any US English, then any English
    this.bestVoice = 
      voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.lang === "en-US" && v.localService) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0] || null;
  }

  static subscribe(listener: (isSpeaking: boolean, isPaused: boolean) => void) {
    this.stateListeners.add(listener);
    listener(this.isSpeaking, this.isPaused);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private static notifyListeners() {
    this.stateListeners.forEach(listener => listener(this.isSpeaking, this.isPaused));
  }

  /**
   * Speaks the provided text using the browser's native speech synthesis.
   */
  static speak(text: string, rate: number = 1.0, pitch: number = 1.0, volume: number = 1.0, voiceURI?: string, onEnd?: () => void) {
    if (!this.synth) {
      console.warn("Speech synthesis not supported.");
      return;
    }

    this.stop(); // Stop any currently playing audio

    const cleanText = text.replace(/[#*`_]/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Keep reference to prevent Chrome garbage collection bug stopping speech halfway
    this.currentUtterance = utterance;
    
    if (voiceURI) {
       const voices = this.synth.getVoices();
       const selected = voices.find(v => v.voiceURI === voiceURI);
       if (selected) this.bestVoice = selected;
    }

    if (!this.bestVoice) this.selectBestVoice();
    if (this.bestVoice) {
      utterance.voice = this.bestVoice;
      utterance.lang = this.bestVoice.lang;
    } else {
      utterance.lang = "en-US";
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.notifyListeners();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notifyListeners();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.error("[SpeechSynthesis] Error:", e);
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notifyListeners();
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  /**
   * Stops the current speech synthesis.
   */
  static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notifyListeners();
    }
  }

  /**
   * Pauses the current speech synthesis.
   */
  static pause() {
    if (this.synth) {
      this.synth.pause();
      this.isPaused = true;
      this.notifyListeners();
    }
  }

  /**
   * Resumes the paused speech synthesis.
   */
  static resume() {
    if (this.synth) {
      this.synth.resume();
      this.isPaused = false;
      this.notifyListeners();
    }
  }

  /**
   * Checks if speech synthesis is currently active (speaking or paused).
   */
  static isCurrentlySpeaking(): boolean {
    return this.synth ? this.synth.speaking || this.synth.pending : false;
  }
}
