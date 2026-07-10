import { useState, useRef, useEffect } from "react";
import { useContentStore } from "../stores";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { SpeechSynthesisService } from "../services/voice";

/**
 * AI Q&A Chat component — allows users to ask questions
 * about the extracted page content with voice support.
 */
export function ContentChat() {
  const { chatMessages, isAsking, askQuestion, clearChat } = useContentStore();
  const [input, setInput] = useState("");
  
  // Playback state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Custom Voice Hooks (abstracts STT, TTS, Commands, Hands-Free mode)
  const { isListening, transcript, speechError, startListening, stopListening } = useVoiceChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSpeaking]);

  // Subscribe to TTS state
  useEffect(() => {
    return SpeechSynthesisService.subscribe((speaking, paused) => {
      setIsSpeaking(speaking);
      setIsPaused(paused);
    });
  }, []);

  // Update input when transcript changes (for visual feedback)
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAsking) return;

    if (isListening) stopListening();
    SpeechSynthesisService.stop(); // Stop reading if user asks a new question

    const question = input;
    setInput("");
    await askQuestion(question);
    inputRef.current?.focus();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      SpeechSynthesisService.stop();
      startListening();
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-4 relative transition-all shadow-sm">
      {/* Playback Controls Overlay (appears when speaking) */}
      {(isSpeaking || isPaused) && (
        <div className="absolute top-2 right-14 z-10 flex items-center gap-2 bg-neutral-900/90 backdrop-blur border border-neutral-700 rounded-full px-2 py-1 shadow-lg animate-in fade-in zoom-in-95">
          {/* Animated Waveform */}
          {isSpeaking && !isPaused && (
            <div className="flex items-center gap-[2px] h-3 mr-1">
              <div className="w-[3px] h-full bg-emerald-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
              <div className="w-[3px] h-[60%] bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" />
              <div className="w-[3px] h-[80%] bg-emerald-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.4s]" />
            </div>
          )}
          {isPaused ? (
            <button 
              onClick={() => SpeechSynthesisService.resume()}
              className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Resume"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={() => SpeechSynthesisService.pause()}
              className="p-1 text-amber-400 hover:text-amber-300 transition-colors"
              title="Pause"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => SpeechSynthesisService.stop()}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-3.5 w-3.5 text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="text-xs font-semibold text-violet-300">
            Ask AI about this page
          </span>
          {isListening && (
            <span className="flex items-center gap-1 ml-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] text-red-400 animate-pulse font-medium">Listening...</span>
            </span>
          )}
        </div>

        {chatMessages.length > 0 && (
          <button
            onClick={() => {
              SpeechSynthesisService.stop();
              clearChat();
            }}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Clear chat"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error Banner */}
      {speechError && (
        <div className="text-[10px] text-red-400 bg-red-950/30 p-2 rounded animate-in slide-in-from-top-1 border border-red-900/50 flex flex-col gap-1.5">
          <span>{speechError}</span>
        </div>
      )}

      {/* Messages */}
      {chatMessages.length > 0 && (
        <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto custom-scrollbar pt-2 scroll-smooth">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2 text-xs leading-relaxed group relative transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.role === "user"
                  ? "ml-6 bg-violet-900/30 border border-violet-800/50 text-violet-100"
                  : "mr-6 bg-neutral-900 border border-neutral-800 text-neutral-200"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`block text-[10px] font-semibold uppercase tracking-wider ${
                    msg.role === "user" ? "text-violet-400" : "text-emerald-400"
                  }`}
                >
                  {msg.role === "user" ? "You" : "AI"}
                </span>
                
                {/* Speaker Button for AI Messages */}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => SpeechSynthesisService.speak(msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-emerald-400 p-0.5"
                    title="Read aloud"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                )}
              </div>
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          ))}

          {/* Typing indicator */}
          {isAsking && (
            <div className="mr-6 rounded-md bg-neutral-800/70 px-2.5 py-2 animate-in fade-in">
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                AI
              </span>
              <div className="flex items-center gap-1.5 h-4">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 items-center mt-1">
        {/* Voice Button */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isAsking}
          className={`flex-shrink-0 p-1.5 rounded transition-all duration-300 ${
            isListening 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]" 
              : "bg-neutral-800 text-neutral-400 hover:text-violet-400 hover:bg-neutral-700"
          } disabled:opacity-50`}
          title={isListening ? "Stop listening" : "Start speaking"}
        >
          {isListening ? (
             <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <rect x="9" y="9" width="6" height="6" fill="currentColor" strokeWidth="2" strokeLinejoin="round" />
             </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening (Say 'Stop reading')..." : "Ask a question..."}
          disabled={isAsking || isListening}
          id="qa-input"
          className="flex-1 min-w-0 rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={isAsking || !input.trim()}
          id="qa-send-btn"
          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 shadow-lg shadow-violet-900/20"
        >
          {isAsking ? (
            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
