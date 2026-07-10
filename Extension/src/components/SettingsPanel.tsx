import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores";
import { AIProviderType } from "../services";

export function SettingsPanel() {
  const {
    settings,
    isLoading,
    loadSettings,
    updateSettings,
    resetSettings,
    exportData,
    importData,
    createBackup,
    restoreBackup,
  } = useSettingsStore();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!settings) loadSettings();
  }, [settings, loadSettings]);

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-white">General</h2>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">
            Default AI Provider
          </label>
          <select
            disabled={isLoading}
            value={settings.defaultProvider}
            onChange={(e) =>
              updateSettings({
                defaultProvider: e.target.value as AIProviderType,
              })
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          >
            {Object.values(AIProviderType).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">Theme</label>
          <select
            disabled={isLoading}
            value={settings.theme}
            onChange={(e) =>
              updateSettings({
                theme: e.target.value as "dark" | "light" | "system",
              })
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">
            Preferred Content Language
          </label>
          <select
            disabled={isLoading}
            value={settings.extractionLanguage || "Original"}
            onChange={(e) =>
              updateSettings({
                extractionLanguage: e.target.value,
              })
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          >
            <option value="Original">Original (No Translation)</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Gujarati">Gujarati (ગુજરાતી)</option>
            <option value="Spanish">Spanish (Español)</option>
            <option value="French">French (Français)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">
            Max Summary Length (chars)
          </label>
          <input
            type="number"
            disabled={isLoading}
            value={settings.maxSummaryLength}
            onChange={(e) =>
              updateSettings({ maxSummaryLength: parseInt(e.target.value, 10) })
            }
            min={100}
            step={100}
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-white">Advanced</h2>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm text-neutral-300">
            Require Confirmation Dialogs
          </span>
          <input
            type="checkbox"
            disabled={isLoading}
            checked={settings.requireConfirmation}
            onChange={(e) =>
              updateSettings({ requireConfirmation: e.target.checked })
            }
            className="h-4 w-4 rounded border-neutral-700 bg-black text-violet-600 focus:ring-violet-600 focus:ring-offset-neutral-900 disabled:opacity-50"
          />
        </label>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm text-neutral-300">
            Auto-Create Checkpoints
          </span>
          <input
            type="checkbox"
            disabled={isLoading}
            checked={settings.autoCreateCheckpoints}
            onChange={(e) =>
              updateSettings({ autoCreateCheckpoints: e.target.checked })
            }
            className="h-4 w-4 rounded border-neutral-700 bg-black text-violet-600 focus:ring-violet-600 focus:ring-offset-neutral-900 disabled:opacity-50"
          />
        </label>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm text-neutral-300">
            Auto-read AI Responses (Voice)
          </span>
          <input
            type="checkbox"
            disabled={isLoading}
            checked={settings.autoReadResponses}
            onChange={(e) =>
              updateSettings({ autoReadResponses: e.target.checked })
            }
            className="h-4 w-4 rounded border-neutral-700 bg-black text-violet-600 focus:ring-violet-600 focus:ring-offset-neutral-900 disabled:opacity-50"
          />
        </label>
        
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs text-neutral-400">AI Voice</label>
          <div className="flex gap-2">
            <select
              disabled={isLoading}
              value={settings.voiceURI || ""}
              onChange={(e) =>
                updateSettings({ voiceURI: e.target.value })
              }
              className="flex-1 rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
            >
              <option value="">System Default</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const text = "Hi, I am your Context(AI) voice assistant. This is how I sound.";
                const utterance = new SpeechSynthesisUtterance(text);
                const selected = voices.find(v => v.voiceURI === settings.voiceURI);
                if (selected) utterance.voice = selected;
                utterance.rate = settings.speechSpeed ?? 1.0;
                utterance.pitch = settings.speechPitch ?? 1.0;
                utterance.volume = settings.speechVolume ?? 1.0;
                window.speechSynthesis.speak(utterance);
              }}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/20"
            >
              Test
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">Speech Speed</label>
          <select
            disabled={isLoading}
            value={settings.speechSpeed || 1.0}
            onChange={(e) =>
              updateSettings({ speechSpeed: parseFloat(e.target.value) })
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          >
            <option value="0.75">Slow (0.75x)</option>
            <option value="1.0">Normal (1.0x)</option>
            <option value="1.25">Fast (1.25x)</option>
            <option value="1.5">Very Fast (1.5x)</option>
            <option value="2.0">Double (2.0x)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-xs text-neutral-400">Speech Pitch</label>
            <span className="text-xs text-neutral-500">{settings.speechPitch || 1.0}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            disabled={isLoading}
            value={settings.speechPitch ?? 1.0}
            onChange={(e) =>
              updateSettings({ speechPitch: parseFloat(e.target.value) })
            }
            className="w-full accent-violet-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-xs text-neutral-400">Speech Volume</label>
            <span className="text-xs text-neutral-500">{settings.speechVolume || 1.0}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            disabled={isLoading}
            value={settings.speechVolume ?? 1.0}
            onChange={(e) =>
              updateSettings({ speechVolume: parseFloat(e.target.value) })
            }
            className="w-full accent-violet-600"
          />
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer mt-2">
          <span className="text-sm text-neutral-300">
            Hands-Free Mode (Continuous Conversation)
          </span>
          <input
            type="checkbox"
            disabled={isLoading}
            checked={settings.handsFreeMode || false}
            onChange={(e) =>
              updateSettings({ handsFreeMode: e.target.checked })
            }
            className="h-4 w-4 rounded border-neutral-700 bg-black text-violet-600 focus:ring-violet-600 focus:ring-offset-neutral-900 disabled:opacity-50"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-white">API Keys</h2>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">
            Google Gemini API Key
          </label>
          <input
            type="password"
            placeholder="AIzaSy..."
            disabled={isLoading}
            value={settings.apiKeys.gemini || ""}
            onChange={(e) =>
              updateSettings({
                apiKeys: { ...settings.apiKeys, gemini: e.target.value },
              })
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-400">
            Groq API Key
          </label>
          <input
            type="password"
            placeholder="gsk_..."
            disabled={isLoading}
            value={settings.apiKeys.groq || ""}
            onChange={(e) =>
              updateSettings({
                apiKeys: { ...settings.apiKeys, groq: e.target.value },
              })
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-white">Data Management</h2>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={exportData}
              disabled={isLoading}
              className="flex-1 rounded bg-neutral-800 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              Export JSON
            </button>
            <label className="flex-1 cursor-pointer rounded bg-neutral-800 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              Import JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={isLoading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (typeof ev.target?.result === "string") {
                        importData(ev.target.result);
                      }
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createBackup}
              disabled={isLoading}
              className="flex-1 rounded border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              Backup to Local
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Restore from local backup? This will overwrite current data.",
                  )
                ) {
                  restoreBackup();
                }
              }}
              disabled={isLoading}
              className="flex-1 rounded border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              Restore Local
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            if (window.confirm("Reset all settings to defaults?")) {
              resetSettings();
            }
          }}
          disabled={isLoading}
          className="rounded px-4 py-2 text-sm text-red-400 transition-colors hover:bg-neutral-800 hover:text-red-300 disabled:opacity-50"
        >
          Reset Defaults
        </button>
      </div>
    </div>
  );
}
