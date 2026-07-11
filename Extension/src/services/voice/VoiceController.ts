import { SilenceDetector } from "./SilenceDetector";
import { LanguageDetector } from "./LanguageDetector";
import { AIResponseHandler } from "./AIResponseHandler";
import { SpeechManager } from "./SpeechManager";
import { useSettingsStore } from "../../stores";
import { RuntimeMessageTypes } from "../runtime/RuntimeMessages";
import { VoiceCommandParser } from "./VoiceCommandParser";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export class VoiceController {
  private static instance: VoiceController | null = null;

  private state: VoiceState = "idle";
  private latestTranscript: string = "";
  private error: string | null = null;
  private silenceDetector: SilenceDetector;
  private listeners: Set<(state: VoiceState, transcript: string, error: string | null) => void> = new Set();
  
  private isUserStoppedManually: boolean = false;
  private isSpeakingSession: boolean = false;

  private constructor() {
    this.silenceDetector = new SilenceDetector(1500); // 1.5s silence detection

    // Register runtime messages from the content script
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message: any) => {
        if (message.type === RuntimeMessageTypes.SPEECH_RECOGNITION_RESULT) {
          const payload = message.payload || {};
          if (payload.transcript !== undefined) {
            this.handleTranscript(payload.transcript);
          }
        } else if (message.type === RuntimeMessageTypes.SPEECH_RECOGNITION_ERROR) {
          this.handleSpeechError(message.payload?.error || "Speech recognition error");
        } else if (message.type === RuntimeMessageTypes.SPEECH_RECOGNITION_END) {
          this.handleSpeechEnd();
        }
      });
    }
  }

  static getInstance(): VoiceController {
    if (!this.instance) {
      this.instance = new VoiceController();
    }
    return this.instance;
  }

  /**
   * Allows React components or hooks to subscribe to state updates.
   */
  subscribe(listener: (state: VoiceState, transcript: string, error: string | null) => void) {
    this.listeners.add(listener);
    listener(this.state, this.latestTranscript, this.error);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(this.state, this.latestTranscript, this.error);
    });
  }

  private updateState(newState: VoiceState) {
    this.state = newState;
    this.notifyListeners();
  }

  getState(): VoiceState {
    return this.state;
  }

  getTranscript(): string {
    return this.latestTranscript;
  }

  getError(): string | null {
    return this.error;
  }

  resetTranscript() {
    this.latestTranscript = "";
    this.notifyListeners();
  }

  /**
   * Starts the continuous or single-turn voice listening.
   */
  async startListening() {
    this.isUserStoppedManually = false;
    this.isSpeakingSession = false;
    this.latestTranscript = "";
    this.error = null;
    this.silenceDetector.clear();

    // Ensure we aren't speaking (avoid feedback loop)
    SpeechManager.stop();

    this.updateState("listening");

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) {
      this.error = "No active tab found.";
      this.updateState("idle");
      return;
    }

    try {
      const settings = useSettingsStore.getState().settings;
      const extLang = settings?.extractionLanguage || "Original";
      
      // Determine recognition language
      let speechLang = "en-US";
      if (extLang === "Hindi") speechLang = "hi-IN";
      else if (extLang === "Marathi") speechLang = "mr-IN";

      await chrome.tabs.sendMessage(tabId, {
        type: RuntimeMessageTypes.START_SPEECH_RECOGNITION,
        payload: { lang: speechLang }
      });
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      this.error = "Failed to start speech recognition. Refresh the tab.";
      this.updateState("idle");
    }
  }

  /**
   * Stops listening and halts all loops.
   */
  async stopListening() {
    this.isUserStoppedManually = true;
    this.isSpeakingSession = false;
    this.silenceDetector.clear();
    SpeechManager.stop();
    this.updateState("idle");

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: RuntimeMessageTypes.STOP_SPEECH_RECOGNITION
        });
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Handles transcript updates from speech recognition.
   */
  private handleTranscript(text: string) {
    if (this.state !== "listening" || this.isUserStoppedManually) return;

    this.latestTranscript = text;
    this.notifyListeners();

    if (text.trim().length > 0) {
      // Start or refresh the silence timer
      this.silenceDetector.start(async () => {
        await this.processSpeech();
      });
    }
  }

  /**
   * Handles speech recognition errors.
   */
  private handleSpeechError(err: string) {
    if (this.isUserStoppedManually) return;
    
    // Ignore benign errors like 'no-speech'
    if (err === "no-speech") {
      this.handleSpeechEnd();
      return;
    }

    console.error("[VoiceController] Speech recognition error:", err);
    this.error = err === "not-allowed" ? "Microphone access denied." : err;
    this.stopListening();
  }

  /**
   * Handles speech recognition end event.
   */
  private async handleSpeechEnd() {
    if (this.state !== "listening" || this.isUserStoppedManually) return;

    // Check if there is something to process
    if (this.latestTranscript.trim()) {
      await this.processSpeech();
    } else {
      // In hands-free mode, if the user didn't speak, restart the recognition to keep it alive
      const settings = useSettingsStore.getState().settings;
      if (settings?.handsFreeMode) {
        setTimeout(() => {
          if (this.state === "listening" && !this.isUserStoppedManually) {
            this.startListening();
          }
        }, 300);
      } else {
        this.updateState("idle");
      }
    }
  }

  /**
   * Processes the completed speech transcript.
   */
  private async processSpeech() {
    if (this.isUserStoppedManually || this.isSpeakingSession) return;
    this.silenceDetector.clear();

    const speechText = this.latestTranscript.trim();
    if (!speechText) {
      this.startListening();
      return;
    }

    // Mic OFF before processing and speaking to avoid feedback loops!
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: RuntimeMessageTypes.STOP_SPEECH_RECOGNITION
        });
      } catch (e) {
        // ignore
      }
    }

    // Transition to processing state
    this.updateState("processing");

    try {
      // 1. Detect language
      const lang = LanguageDetector.detect(speechText);

      // 2. Check for voice commands
      const command = VoiceCommandParser.parse(speechText);
      if (command.isCommand) {
        // If command is to cancel or stop reading
        if (command.intent === "stop_reading") {
          this.stopListening();
          return;
        }
      }

      // 3. Generate AI response (it also updates Zustands chatMessages)
      const answer = await AIResponseHandler.generate(speechText, lang);

      if (this.isUserStoppedManually) return;

      // 4. Transition to speaking state
      this.updateState("speaking");
      this.isSpeakingSession = true;

      // 5. Playback the speech response
      SpeechManager.speak(answer, lang, () => {
        this.isSpeakingSession = false;
        
        // 6. Automatically resume listening if hands-free is enabled
        const settings = useSettingsStore.getState().settings;
        if (settings?.handsFreeMode && !this.isUserStoppedManually) {
          this.startListening();
        } else {
          this.updateState("idle");
        }
      });
    } catch (err: any) {
      console.error("[VoiceController] Error processing speech:", err);
      this.error = err.message || "Failed to generate AI response.";
      
      const settings = useSettingsStore.getState().settings;
      if (settings?.handsFreeMode && !this.isUserStoppedManually) {
        this.startListening();
      } else {
        this.updateState("idle");
      }
    }
  }
}
