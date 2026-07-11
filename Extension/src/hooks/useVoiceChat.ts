import { useCallback, useEffect, useState } from "react";
import { useContentStore, useSettingsStore } from "../stores";
import { SpeechSynthesisService, VoiceCommandParser, VoiceCommandIntent, VoiceController } from "../services/voice";
import type { VoiceState } from "../services/voice";
import { usePageReader } from "./usePageReader";

export function useVoiceChat() {
  const { chatMessages, isAsking, askQuestion, setLastSpokenMessage, lastSpokenMessage } = useContentStore();
  const { settings } = useSettingsStore();
  const { startReading, stopReading, pauseReading, resumeReading } = usePageReader();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Subscribe to VoiceController
  useEffect(() => {
    const controller = VoiceController.getInstance();
    const unsubscribe = controller.subscribe((state, currentTranscript, error) => {
      setVoiceState(state);
      setTranscript(currentTranscript);
      setSpeechError(error);
    });
    return unsubscribe;
  }, []);

  // Watch for typed AI responses to speak them automatically (if not already speaking in voice session)
  useEffect(() => {
    if (!settings?.autoReadResponses) return;
    if (voiceState === "speaking" || voiceState === "processing") return; // Let VoiceController handle voice sessions
    
    const latestMessage = chatMessages[chatMessages.length - 1];
    
    // Check if it's a new AI message that we haven't spoken yet
    if (latestMessage && latestMessage.role === "assistant" && !isAsking) {
      // Prevent re-speaking the same message if re-rendered
      if (lastSpokenMessage !== latestMessage.content) {
        setLastSpokenMessage(latestMessage.content);
        
        SpeechSynthesisService.speak(
          latestMessage.content,
          settings.speechSpeed || 1.0,
          settings.speechPitch ?? 1.0,
          settings.speechVolume ?? 1.0,
          settings.voiceURI
        );
      }
    }
  }, [chatMessages, isAsking, settings?.autoReadResponses, settings?.speechSpeed, lastSpokenMessage, setLastSpokenMessage, voiceState]);

  // Command parser interception
  const handleVoiceCommand = useCallback(async (intent: VoiceCommandIntent) => {
    switch (intent) {
      case VoiceCommandIntent.STOP_READING:
        stopReading(); // from usePageReader
        break;
      case VoiceCommandIntent.PAUSE:
        pauseReading();
        break;
      case VoiceCommandIntent.RESUME:
        resumeReading();
        break;
      case VoiceCommandIntent.READ_PAGE:
        startReading(true); // from beginning
        break;
      case VoiceCommandIntent.SUMMARIZE_PAGE:
        await askQuestion("Provide a concise summary of this page.");
        break;
      case VoiceCommandIntent.EXPLAIN_PARAGRAPH:
        await askQuestion("Explain the most important section of this page in detail.");
        break;
      case VoiceCommandIntent.READ_IMPORTANT:
        await askQuestion("What are the key takeaways from this page? Use bullet points.");
        break;
      case VoiceCommandIntent.REPEAT:
        if (lastSpokenMessage) {
          SpeechSynthesisService.speak(
            lastSpokenMessage, 
            settings?.speechSpeed || 1.0,
            settings?.speechPitch ?? 1.0,
            settings?.speechVolume ?? 1.0,
            settings?.voiceURI
          );
        }
        break;
    }
  }, [askQuestion, lastSpokenMessage, settings?.speechSpeed, startReading, stopReading, pauseReading, resumeReading]);

  // Intercept transcripts in real-time to check for commands
  useEffect(() => {
    if (transcript && voiceState === "listening") {
      const command = VoiceCommandParser.parse(transcript);
      if (command.isCommand) {
        // Execute the command action
        handleVoiceCommand(command.intent!);
        
        // Stop VoiceController and clear transcript
        const controller = VoiceController.getInstance();
        controller.stopListening();
        controller.resetTranscript();
      }
    }
  }, [transcript, voiceState, handleVoiceCommand]);

  const startListening = useCallback(() => {
    VoiceController.getInstance().startListening();
  }, []);

  const stopListening = useCallback(() => {
    VoiceController.getInstance().stopListening();
  }, []);

  const resetTranscript = useCallback(() => {
    VoiceController.getInstance().resetTranscript();
  }, []);

  return {
    voiceState,
    isListening: voiceState === "listening",
    transcript,
    speechError,
    startListening,
    stopListening,
    resetTranscript,
  };
}
