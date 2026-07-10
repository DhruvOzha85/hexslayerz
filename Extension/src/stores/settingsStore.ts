import { create } from "zustand";
import { ApplicationService, type ContextAISettings } from "../services";

interface SettingsState {
  settings: ContextAISettings | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<ContextAISettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  clearSuccessMessage: () => void;
  clearError: () => void;

  exportData: () => Promise<void>;
  importData: (json: string) => Promise<void>;
  createBackup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,
  successMessage: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await ApplicationService.loadSettings();
      set({ settings: data, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load settings",
        isLoading: false,
      });
    }
  },

  updateSettings: async (updates: Partial<ContextAISettings>) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const newSettings = await ApplicationService.saveSettings(updates);
      set({
        settings: newSettings,
        isLoading: false,
        successMessage: "Settings saved.",
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to save settings",
        isLoading: false,
      });
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const defaultSettings = await ApplicationService.resetSettings();
      set({
        settings: defaultSettings,
        isLoading: false,
        successMessage: "Settings reset to defaults.",
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to reset settings",
        isLoading: false,
      });
    }
  },

  exportData: async () => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const json = await ApplicationService.exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `context-ai-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      set({ isLoading: false, successMessage: "Data exported successfully." });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to export data",
        isLoading: false,
      });
    }
  },

  importData: async (json: string) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await ApplicationService.importData(json);
      const data = await ApplicationService.loadSettings();
      set({
        settings: data,
        isLoading: false,
        successMessage: "Data imported successfully.",
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import data",
        isLoading: false,
      });
    }
  },

  createBackup: async () => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await ApplicationService.createBackup();
      set({ isLoading: false, successMessage: "Local backup created." });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create backup",
        isLoading: false,
      });
    }
  },

  restoreBackup: async () => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await ApplicationService.restoreBackup();
      const data = await ApplicationService.loadSettings();
      set({
        settings: data,
        isLoading: false,
        successMessage: "Local backup restored.",
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to restore backup",
        isLoading: false,
      });
    }
  },

  clearSuccessMessage: () => set({ successMessage: null }),
  clearError: () => set({ error: null }),
}));
