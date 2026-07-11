import { useState, useRef, useEffect } from "react";
import { useShoppingStore } from "../stores";
import { VoiceOutput } from "../services/shopping";

export function ShoppingView() {
  const [query, setQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { isProcessing, error, lastIntent, lastData, lastLanguage, processQuery } = useShoppingStore();

  useEffect(() => {
    // Initialize Web Speech API recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        processQuery(transcript, true); // Auto-submit and speak back
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [processQuery]);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      // Before starting to listen, stop any AI speech
      VoiceOutput.stop();
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    VoiceOutput.stop();
    processQuery(query, false); // Don't speak back if manually typed
  };

  const stopVoice = () => {
    VoiceOutput.stop();
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Input Section */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a shopping question..."
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleMicClick}
          className={`rounded px-3 py-2 text-white transition-colors ${
            isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-neutral-800 hover:bg-neutral-700"
          }`}
          title={isRecording ? "Stop recording" : "Record voice query"}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={isProcessing || !query.trim()}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      {isProcessing && (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isProcessing && !error && lastData && (
        <div className="flex flex-col gap-3 rounded border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-amber-500">
              {lastIntent} Analysis ({lastLanguage})
            </span>
            <button onClick={stopVoice} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              Stop Voice
            </button>
          </div>

          {/* Render based on intent */}
          {lastIntent === "review" && (
            <>
              <div className="text-sm font-semibold">Sentiment: <span className={lastData.sentiment === 'Positive' ? 'text-green-400' : lastData.sentiment === 'Negative' ? 'text-red-400' : 'text-neutral-400'}>{lastData.sentiment}</span></div>
              <div className="text-sm">{lastData.summary}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs">
                  <strong className="text-green-400">Pros</strong>
                  <ul className="list-disc pl-4 text-neutral-300">
                    {lastData.pros?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div className="text-xs">
                  <strong className="text-red-400">Cons</strong>
                  <ul className="list-disc pl-4 text-neutral-300">
                    {lastData.cons?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </>
          )}

          {lastIntent === "compare" && (
            <>
              <div className="text-sm font-semibold mb-2 text-emerald-400">Recommendation: {lastData.recommendation}</div>
              <div className="text-xs mb-3 italic">{lastData.reasoning}</div>
              <div className="flex flex-col gap-2">
                {lastData.products?.map((p: any, i: number) => (
                  <div key={i} className="bg-black p-2 rounded border border-neutral-800">
                    <div className="font-bold text-sm text-amber-100">{p.name} <span className="text-neutral-500 float-right">{p.price}</span></div>
                    <div className="text-xs text-neutral-400 mt-1">⭐ {p.rating}</div>
                    <div className="text-xs mt-1 text-green-300">+ {p.pros}</div>
                    <div className="text-xs text-red-300">- {p.cons}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {lastIntent === "recommend" && (
            <>
              <div className="text-sm mb-3">{lastData.summary}</div>
              <div className="flex flex-col gap-2">
                {lastData.suggestions?.map((s: any, i: number) => (
                  <div key={i} className="bg-black p-2 rounded border border-neutral-800">
                    <div className="font-bold text-sm text-amber-100">{s.name}</div>
                    <div className="text-xs text-amber-500 font-semibold">{s.price}</div>
                    <div className="text-xs text-neutral-400 mt-1">{s.whyToBuy}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {lastIntent === "fake_check" && (
            <>
              <div className="text-sm font-semibold">
                Status: <span className={lastData.label === 'Genuine' ? 'text-green-400' : 'text-red-400'}>{lastData.label}</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">Confidence: {lastData.confidenceScore}%</div>
              <div className="text-sm mt-2">{lastData.reasoning}</div>
            </>
          )}

          {lastIntent === "unknown" && (
            <div className="text-sm">I'm sorry, I couldn't understand the shopping query. Could you please rephrase it?</div>
          )}
        </div>
      )}
    </div>
  );
}
