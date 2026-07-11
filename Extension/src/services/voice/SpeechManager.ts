import { SpeechSynthesisService } from "./SpeechSynthesisService";
import { useSettingsStore } from "../../stores";

export class SpeechManager {
  /**
   * Speaks the provided text in the target language.
   */
  static speak(text: string, lang: "en" | "hi" | "mr", onEnd?: () => void) {
    const settings = useSettingsStore.getState().settings;

    // Get the browser's speech synthesis voices
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    const voices = synth ? synth.getVoices() : [];

    let selectedVoice: SpeechSynthesisVoice | null = null;

    // 1. If user has a selected custom voice URI in settings, check if it matches the language
    if (settings?.voiceURI) {
      const customVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (customVoice && customVoice.lang.startsWith(lang)) {
        selectedVoice = customVoice;
      }
    }

    // 2. Otherwise, find the best voice that starts with the language code
    if (!selectedVoice) {
      if (lang === "hi") {
        selectedVoice = voices.find(v => v.lang.startsWith("hi")) || null;
      } else if (lang === "mr") {
        selectedVoice = voices.find(v => v.lang.startsWith("mr")) || null;
      } else {
        // Preferred English voice
        selectedVoice =
          voices.find(v => v.name.includes("Google US English")) ||
          voices.find(v => v.lang === "en-US" && v.localService) ||
          voices.find(v => v.lang.startsWith("en")) ||
          null;
      }
    }

    const voiceURI = selectedVoice ? selectedVoice.voiceURI : undefined;

    SpeechSynthesisService.speak(
      text,
      settings?.speechSpeed || 1.0,
      settings?.speechPitch ?? 1.0,
      settings?.speechVolume ?? 1.0,
      voiceURI,
      onEnd
    );
  }

  /**
   * Stops any ongoing speech.
   */
  static stop() {
    SpeechSynthesisService.stop();
  }
}
