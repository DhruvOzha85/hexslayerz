import { useState, useEffect } from "react";
import { Sparkles, FileText, MessageSquare, Mic, Zap, ChevronRight, ChevronLeft } from "lucide-react";

export function OnboardingGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0); // 0 = Welcome, 1-4 = Guide

  useEffect(() => {
    const hasSeen = localStorage.getItem("context-ai-onboarding-completed");
    if (hasSeen !== "true") {
      setIsVisible(true);
    }

    const handleOpen = () => {
      setStep(0);
      setIsVisible(true);
    };

    window.addEventListener("open-onboarding", handleOpen);
    return () => window.removeEventListener("open-onboarding", handleOpen);
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem("context-ai-onboarding-completed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-[360px] overflow-hidden rounded-3xl border border-neutral-800 bg-black shadow-[0_0_50px_-12px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
        
        {/* Welcome Screen */}
        {step === 0 && (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 ring-4 ring-violet-500/10">
              <Sparkles className="h-8 w-8" />
            </div>
            
            <h2 className="mb-3 text-xl font-bold text-white">
              👋 Welcome to Context(AI) AI Browser Companion
            </h2>
            
            <p className="mb-8 text-sm leading-relaxed text-neutral-400">
              Understand any webpage instantly using AI. Read pages aloud, ask questions, summarize articles, and explore content naturally.
            </p>
            
            <div className="flex w-full flex-col gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.98] shadow-lg shadow-violet-900/20"
              >
                Start Exploring
              </button>
              <button
                onClick={finishOnboarding}
                className="w-full rounded-lg py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Skip Tutorial
              </button>
            </div>
          </div>
        )}

        {/* Carousel Steps */}
        {step > 0 && (
          <div className="flex flex-col p-6">
            
            {/* Progress indicators */}
            <div className="mb-8 flex justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                    i === step ? "bg-violet-500" : "bg-neutral-800"
                  }`}
                />
              ))}
            </div>

            {/* Content area */}
            <div className="mb-8 flex min-h-[160px] flex-col items-center text-center">
              {step === 1 && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">📄 Extract the page</h3>
                  <p className="text-sm text-neutral-400">
                    Click "Extract Page Content" to instantly analyze the current webpage and create a smart summary.
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">💬 Ask Questions</h3>
                  <p className="mb-3 text-sm text-neutral-400">
                    Ask anything about the page naturally.
                  </p>
                  <div className="flex flex-col gap-2 text-left">
                    <div className="rounded border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-300">
                      "What is this article about?"
                    </div>
                    <div className="rounded border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-300">
                      "Explain this paragraph simply"
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                    <Mic className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">🎤 Voice Assistant</h3>
                  <p className="mb-3 text-sm text-neutral-400">
                    Use the microphone for hands-free control.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-[10px] font-medium text-neutral-300">Read this page</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-[10px] font-medium text-neutral-300">Stop Reading</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-[10px] font-medium text-neutral-300">Summarize this</span>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">✨ Productivity</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    Read articles faster.<br/>
                    Understand complex documentation.<br/>
                    Learn difficult topics.<br/>
                    Save your valuable time.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-900/20"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={finishOnboarding}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                >
                  Finish
                </button>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
