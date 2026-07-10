// Context(AI) — Content Extraction Types

export interface ContentSection {
  heading: string;
  text: string;
}

export interface ExtractedContent {
  title: string;
  content: string;
  sections: ContentSection[];
  url: string;
  extractedAt: number;
  websiteType: WebsiteType;
}

export interface ExtractionError {
  error: string;
}

export type ExtractionResult =
  | { success: true; data: ExtractedContent }
  | { success: false; error: string };

export const WebsiteTypes = {
  WIKIPEDIA: "wikipedia",
  DOCUMENTATION: "documentation",
  BLOG: "blog",
  GITHUB: "github",
  GENERIC: "generic",
} as const;

export type WebsiteType = (typeof WebsiteTypes)[keyof typeof WebsiteTypes];
