import type { AIProviderType } from "./ProviderTypes";

export interface Summary {
  title: string;
  content: string;
  provider: AIProviderType;
  generatedAt: number;
}

export type SummarizationResult =
  { success: true; data: Summary } | { success: false; error: string };
