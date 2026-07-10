import { useCallback, useEffect } from "react";
import { useContentStore, useSettingsStore } from "../stores";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { SpeechSynthesisService, VoiceCommandParser, VoiceCommandIntent } from "../services/voice";
import { usePageReader } from "./usePageReader";

export function useVoiceChat() {
  const { chatMessages, isAsking, askQuestion, setLastSpokenMessage, lastSpokenMessage } = useContentStore();
  const { settings } = useSettingsStore();
  const { isListening, transcript, startListening, stopListening, error: speechError, resetTranscript } = useSpeechRecognition();
  const { startReading, stopReading, pauseReading, resumeReading } = usePageReader();

  // Watch for AI responses to speak them automatically (and handle Hands-Free mode)
  useEffect(() => {
    if (!settings?.autoReadResponses) return;
    
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
          settings.voiceURI,
          () => {
            // Callback when speaking finishes
            if (settings.handsFreeMode) {
              startListening(); // Auto-listen for next command/question
            }
          }
        );
      }
    }
  }, [chatMessages, isAsking, settings?.autoReadResponses, settings?.speechSpeed, settings?.handsFreeMode, lastSpokenMessage, setLastSpokenMessage, startListening]);

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

  // Intercept transcripts in real-time
  useEffect(() => {
    if (transcript) {
      const command = VoiceCommandParser.parse(transcript);
      if (command.isCommand) {
        handleVoiceCommand(command.intent!);
        resetTranscript();
        stopListening();
      }
    }
  }, [transcript, handleVoiceCommand, resetTranscript, stopListening]);

  return {
    isListening,
    transcript,
    speechError,
    startListening,
    stopListening,
    resetTranscript,
  };
}
