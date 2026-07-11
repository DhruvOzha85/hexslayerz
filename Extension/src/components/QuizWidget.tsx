import { useState } from "react";
import { useContentStore } from "../stores";
import { ApplicationService } from "../services";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function QuizWidget() {
  const { extractedContent } = useContentStore();
  const [quizState, setQuizState] = useState<"idle" | "loading" | "active" | "completed" | "error">("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const generateQuiz = async () => {
    if (!extractedContent) return;
    setQuizState("loading");
    setErrorMsg("");

    try {
      const promptText = `Generate a multiple-choice quiz of 3 questions based strictly on the webpage content. You MUST format your JSON response's "content" field strictly as a raw JSON array (do not add conversational words around it). The JSON array must consist of objects, each containing: "question" (string), "options" (array of 4 choice strings starting with A), B), C), D)), "correctIndex" (number 0 to 3), and "explanation" (string explaining the correct answer).`;

      const response = await ApplicationService.askPageQuestion(
        promptText,
        extractedContent,
        "quiz"
      );

      let parsedQuestions: Question[] = [];

      if (Array.isArray(response)) {
        parsedQuestions = response;
      } else if (response && typeof response === "object") {
        const obj = response as any;
        if (Array.isArray(obj.questions)) {
          parsedQuestions = obj.questions;
        } else if (Array.isArray(obj.content)) {
          parsedQuestions = obj.content;
        } else {
          parsedQuestions = [obj];
        }
      } else if (typeof response === "string") {
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.replace(/^```json/, "").replace(/```$/, "");
        } else if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```/, "").replace(/```$/, "");
        }
        cleanedResponse = cleanedResponse.trim();

        const parsed = JSON.parse(cleanedResponse);
        if (Array.isArray(parsed)) {
          parsedQuestions = parsed;
        } else if (parsed && typeof parsed === "object") {
          const obj = parsed as any;
          if (Array.isArray(obj.questions)) {
            parsedQuestions = obj.questions;
          } else if (Array.isArray(obj.content)) {
            parsedQuestions = obj.content;
          } else {
            parsedQuestions = [obj];
          }
        }
      }

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error("Invalid quiz structure returned from AI.");
      }

      setQuestions(parsedQuestions);
      setCurrentIndex(0);
      setSelectedOption(null);
      setScore(0);
      setQuizState("active");
    } catch (err: any) {
      console.error("[QuizWidget] Generation failed:", err);
      setErrorMsg(err.message || "Failed to parse quiz response.");
      setQuizState("error");
    }
  };

  const handleOptionClick = (idx: number) => {
    if (selectedOption !== null) return;
    const q = questions[currentIndex];
    if (!q) return;
    setSelectedOption(idx);
    if (idx === q.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizState("completed");
    }
  };

  if (quizState === "idle") {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-neutral-800 bg-neutral-950 rounded-xl animate-in fade-in duration-300">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/10 text-violet-400">
          <span className="text-2xl">🎮</span>
        </div>
        <h4 className="text-sm font-bold text-white mb-1">Page Brain Gym</h4>
        <p className="text-xs text-neutral-400 max-w-[250px] mb-4">
          Ready to test your comprehension? Let AI design a custom interactive quiz based on this article.
        </p>
        <button
          onClick={generateQuiz}
          className="rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-colors"
        >
          Generate Quiz
        </button>
      </div>
    );
  }

  if (quizState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-neutral-800 bg-neutral-950 rounded-xl">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-violet-600 flex items-center justify-center text-xs text-white">🎮</span>
        </div>
        <span className="mt-4 text-xs text-neutral-300 animate-pulse font-medium">
          AI is reading and writing questions...
        </span>
      </div>
    );
  }

  if (quizState === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-neutral-800 bg-neutral-950 rounded-xl">
        <span className="text-2xl mb-2">⚠️</span>
        <h4 className="text-sm font-bold text-red-400 mb-1">Quiz Generation Failed</h4>
        <p className="text-[10px] text-neutral-500 mb-4 max-w-[200px] truncate">{errorMsg}</p>
        <button
          onClick={generateQuiz}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (quizState === "active") {
    const q = questions[currentIndex];
    if (!q) return null;
    return (
      <div className="flex flex-col border border-neutral-800 bg-neutral-950 rounded-xl p-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-[10px] text-neutral-500 font-semibold">
            Score: {score}
          </span>
        </div>

        <h4 className="text-xs font-bold text-white mb-4 leading-relaxed">
          {q.question}
        </h4>

        <div className="flex flex-col gap-2 mb-4">
          {q.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === q.correctIndex;
            const showFeedback = selectedOption !== null;

            let btnStyle = "border-neutral-800 bg-neutral-900/50 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900";
            if (showFeedback) {
              if (isCorrect) {
                btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium";
              } else if (isSelected) {
                btnStyle = "border-red-500 bg-red-500/10 text-red-400 font-medium shake-animation";
              } else {
                btnStyle = "border-neutral-800 bg-neutral-900/20 text-neutral-600 cursor-not-allowed";
              }
            }

            return (
              <button
                key={idx}
                disabled={showFeedback}
                onClick={() => handleOptionClick(idx)}
                className={`w-full text-left rounded-lg border p-2.5 text-xs transition-all duration-200 ${btnStyle}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <div className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800 mb-4 animate-in fade-in slide-in-from-top-1">
            <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Explanation</div>
            <p className="text-[11px] leading-relaxed text-neutral-300">{q.explanation}</p>
          </div>
        )}

        {selectedOption !== null && (
          <button
            onClick={handleNext}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            <span>→</span>
          </button>
        )}
      </div>
    );
  }

  if (quizState === "completed") {
    const isPerfect = score === questions.length;
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-neutral-800 bg-neutral-950 rounded-xl animate-in zoom-in-95 duration-300">
        <span className="text-3xl mb-2">{isPerfect ? "🎉" : "💪"}</span>
        <h4 className="text-sm font-bold text-white mb-1">
          {isPerfect ? "Perfect Score!" : "Good Effort!"}
        </h4>
        <p className="text-xs text-neutral-400 mb-4">
          You scored <span className="font-bold text-violet-400">{score}</span> out of <span className="font-bold">{questions.length}</span> questions.
        </p>
        <div className="flex gap-2">
          <button
            onClick={generateQuiz}
            className="rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={() => setQuizState("idle")}
            className="rounded-lg border border-neutral-700 bg-neutral-850 hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-neutral-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
