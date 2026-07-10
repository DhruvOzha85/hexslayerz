// LSCS v2 — Content Extractor
import type {
  ContentSection,
  WebsiteType,
} from "./ContentExtractionTypes";
import { NoiseFilter } from "./NoiseFilter";
import { WebsiteClassifier } from "./WebsiteClassifier";

interface RawExtraction {
  title: string;
  fullText: string;
  sections: ContentSection[];
  websiteType: WebsiteType;
}

/**
 * The main content extraction engine.
 * Clones the DOM, strips noise, and extracts structured content.
 */
export class ContentExtractor {
  /**
   * Runs the full extraction pipeline on the current page.
   */
  static extract(): RawExtraction {
    const url = window.location.href;
    const websiteType = WebsiteClassifier.classify(url);

    // 1. Clone the entire document body to avoid live-DOM mutation
    const clone = document.body.cloneNode(true) as HTMLElement;

    // 2. Strip noise from the clone
    NoiseFilter.filter(clone, websiteType);

    // 3. Find the main content container
    const contentRoot = this.findContentRoot(clone);

    // 4. Extract the page title
    const title = this.extractTitle(websiteType);

    // 5. Walk the content tree to extract sections
    const sections = this.extractSections(contentRoot, websiteType);

    // 6. Build full plain-text content
    const fullText = this.buildFullText(contentRoot);

    return {
      title,
      fullText,
      sections,
      websiteType,
    };
  }

  /**
   * Locate the most likely main content container.
   * Priority: <article> > <main> > [role="main"] > largest text block > body
   */
  private static findContentRoot(root: HTMLElement): HTMLElement {
    // Try semantic containers first
    const article = root.querySelector("article");
    if (article && (article.textContent || "").trim().length > 200) {
      return article as HTMLElement;
    }

    const main = root.querySelector("main");
    if (main && (main.textContent || "").trim().length > 200) {
      return main as HTMLElement;
    }

    const roleMain = root.querySelector('[role="main"]');
    if (roleMain && (roleMain.textContent || "").trim().length > 200) {
      return roleMain as HTMLElement;
    }

    // Fallback: find the largest text-dense block
    const candidates = root.querySelectorAll(
      "div, section",
    );
    let bestCandidate: HTMLElement = root;
    let bestLength = 0;

    candidates.forEach((el) => {
      const textLen = (el.textContent || "").trim().length;
      // A good content block should have significant text and not be the root itself
      if (textLen > bestLength && textLen > 200) {
        bestCandidate = el as HTMLElement;
        bestLength = textLen;
      }
    });

    return bestCandidate;
  }

  /**
   * Extract the page title from multiple sources with priority:
   * 1. <h1> on page
   * 2. og:title meta
   * 3. <title> tag
   * 4. Fallback to URL
   */
  private static extractTitle(websiteType: WebsiteType): string {
    // For Wikipedia, the page title is in #firstHeading
    if (websiteType === "wikipedia") {
      const wikiTitle = document.querySelector("#firstHeading");
      if (wikiTitle?.textContent?.trim()) {
        return wikiTitle.textContent.trim();
      }
    }

    // Primary: first <h1>
    const h1 = document.querySelector("h1");
    if (h1?.textContent?.trim()) {
      return h1.textContent.trim();
    }

    // Secondary: Open Graph title
    const ogTitle = document.querySelector(
      'meta[property="og:title"]',
    ) as HTMLMetaElement | null;
    if (ogTitle?.content?.trim()) {
      return ogTitle.content.trim();
    }

    // Tertiary: document title
    if (document.title.trim()) {
      return document.title.trim();
    }

    // Last resort
    return window.location.hostname;
  }

  /**
   * Walk the content root and extract heading + text sections.
   */
  private static extractSections(
    root: HTMLElement,
    _websiteType: WebsiteType,
  ): ContentSection[] {
    const sections: ContentSection[] = [];
    const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");

    if (headings.length === 0) {
      // No headings — treat the entire content as one section
      const text = this.getTextUntilNextHeading(root, null);
      if (text.trim()) {
        sections.push({ heading: "", text: text.trim() });
      }
      return sections;
    }

    // Extract text before the very first heading
    const firstHeading = headings[0] as HTMLElement;
    const preText = this.getTextBetweenElements(root, null, firstHeading);
    if (preText.trim()) {
      sections.push({
        heading: "Introduction",
        text: preText.trim(),
      });
    }

    // Extract content between each pair of headings
    headings.forEach((heading, index) => {
      const headingText = (heading.textContent || "").trim();
      const nextHeading = headings[index + 1] || null;

      const sectionText = this.getTextBetweenElements(
        root,
        heading as HTMLElement,
        nextHeading as HTMLElement | null,
      );

      if (headingText || sectionText.trim()) {
        sections.push({
          heading: headingText,
          text: sectionText.trim(),
        });
      }
    });

    return sections;
  }

  /**
   * Get text content between two elements (current heading to next heading).
   */
  private static getTextBetweenElements(
    root: HTMLElement,
    start: HTMLElement | null,
    end: HTMLElement | null,
  ): string {
    const textParts: string[] = [];
    let collecting = start === null;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        const el = node as HTMLElement;
        // Skip trivially empty nodes but accept block-level containers
        if (el.tagName && !["SCRIPT", "STYLE"].includes(el.tagName)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });

    let node = walker.nextNode() as HTMLElement | null;
    while (node) {
      if (start && node === start) {
        collecting = true;
        node = walker.nextNode() as HTMLElement | null;
        continue;
      }

      if (end && node === end) {
        break;
      }

      if (collecting) {
        const tag = node.tagName?.toLowerCase();

        // Handle special elements
        if (tag === "pre" || tag === "code") {
          const codeText = (node.textContent || "").trim();
          if (codeText) {
            textParts.push(`\`\`\`\n${codeText}\n\`\`\``);
          }
        } else if (tag === "li") {
          const liText = (node.textContent || "").trim();
          if (liText) {
            textParts.push(`• ${liText}`);
          }
        } else if (tag === "p") {
          const pText = (node.textContent || "").trim();
          if (pText) {
            textParts.push(pText);
          }
        } else if (tag === "table") {
          textParts.push(this.tableToText(node));
        }
      }

      node = walker.nextNode() as HTMLElement | null;
    }

    return textParts.join("\n\n");
  }

  /**
   * Get text from root until the first heading (for pre-heading content).
   */
  private static getTextUntilNextHeading(
    root: HTMLElement,
    _nextHeading: HTMLElement | null,
  ): string {
    // Simple fallback: extract all innerText from the root
    return root.innerText || root.textContent || "";
  }

  /**
   * Convert an HTML <table> element into readable plain text.
   */
  private static tableToText(tableEl: HTMLElement): string {
    const rows = tableEl.querySelectorAll("tr");
    const lines: string[] = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      const cellTexts: string[] = [];
      cells.forEach((cell) => {
        cellTexts.push((cell.textContent || "").trim());
      });
      if (cellTexts.length > 0) {
        lines.push(cellTexts.join(" | "));
      }
    });

    return lines.join("\n");
  }

  /**
   * Build the full plain text from the content root.
   */
  private static buildFullText(root: HTMLElement): string {
    return root.innerText || root.textContent || "";
  }
}
