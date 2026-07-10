import { create } from "zustand";
import {
  ApplicationService,
  type Checkpoint,
  type AIProviderType,
} from "../services";

interface CheckpointState {
  checkpoints: Checkpoint[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  searchQuery: string;
  providerFilter: AIProviderType | "ALL";
  sortDirection: "desc" | "asc";

  // Actions
  loadCheckpoints: () => Promise<void>;
  createCheckpoint: (provider?: AIProviderType) => Promise<void>;
  deleteCheckpoint: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setProviderFilter: (provider: AIProviderType | "ALL") => void;
  setSortDirection: (dir: "desc" | "asc") => void;
  clearSuccessMessage: () => void;
  clearError: () => void;
}

export const useCheckpointStore = create<CheckpointState>((set) => ({
  checkpoints: [],
  isLoading: false,
  error: null,
  successMessage: null,
  searchQuery: "",
  providerFilter: "ALL",
  sortDirection: "desc",

  loadCheckpoints: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await ApplicationService.loadCheckpoints();
      set({ checkpoints: data, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load checkpoints",
        isLoading: false,
      });
    }
  },

  createCheckpoint: async (provider?: AIProviderType) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await ApplicationService.createCheckpoint(provider);
      const data = await ApplicationService.loadCheckpoints();
      set({
        checkpoints: data,
        isLoading: false,
        successMessage: "Checkpoint created successfully!",
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkpoint",
        isLoading: false,
      });
    }
  },

  deleteCheckpoint: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await ApplicationService.deleteCheckpoint(id);
      const data = await ApplicationService.loadCheckpoints();
      set({
        checkpoints: data,
        isLoading: false,
        successMessage: "Checkpoint deleted.",
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete checkpoint",
        isLoading: false,
      });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setProviderFilter: (provider: AIProviderType | "ALL") =>
    set({ providerFilter: provider }),
  setSortDirection: (dir: "desc" | "asc") => set({ sortDirection: dir }),
  clearSuccessMessage: () => set({ successMessage: null }),
  clearError: () => set({ error: null }),
}));
