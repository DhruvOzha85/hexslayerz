// Context(AI) — Content Extractor
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

    // 1. Find the main content container first (or isolate it)
    let contentRoot: HTMLElement;

    if (websiteType === "github") {
      // For GitHub, bypass whole-page cloning and isolate the README directly
      const readme = document.querySelector(".markdown-body");
      if (readme) {
        contentRoot = readme.cloneNode(true) as HTMLElement;
        NoiseFilter.filter(contentRoot, websiteType);
      } else {
        const clone = document.body.cloneNode(true) as HTMLElement;
        NoiseFilter.filter(clone, websiteType);
        contentRoot = this.findContentRoot(clone);
      }
    } else {
      const clone = document.body.cloneNode(true) as HTMLElement;
      NoiseFilter.filter(clone, websiteType);
      contentRoot = this.findContentRoot(clone);
    }

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
    // Try to find GitHub markdown body first (specific to github sites)
    const markdownBody = root.querySelector(".markdown-body");
    if (markdownBody && (markdownBody.textContent || "").trim().length > 100) {
      return markdownBody as HTMLElement;
    }

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

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
      acceptNode: (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG"].includes(el.tagName.toUpperCase())) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node = walker.nextNode();
    while (node) {
      if (start && node === start) {
        collecting = true;
      } else if (end && node === end) {
        break;
      } else if (collecting) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue?.trim();
          if (text) {
            textParts.push(text);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as HTMLElement).tagName.toUpperCase();
          if (["P", "DIV", "BR", "LI", "TR", "H1", "H2", "H3", "H4", "H5", "H6"].includes(tag)) {
            textParts.push("\n");
          }
        }
      }
      node = walker.nextNode();
    }

    // Clean up extra newlines and spaces
    return textParts.join(" ").replace(/\n\s+/g, "\n").replace(/\n+/g, "\n\n").trim();
  }

  /**
   * Get text from root until the first heading (for pre-heading content).
   * Uses textContent since innerText is unreliable on detached/cloned DOM nodes.
   */
  private static getTextUntilNextHeading(
    root: HTMLElement,
    _nextHeading: HTMLElement | null,
  ): string {
    return this.buildFullText(root);
  }

  /**
   * Build the full plain text from the content root.
   * Uses a TreeWalker to collect text nodes because `innerText` is empty
   * on detached (cloned) DOM elements that haven't been rendered.
   */
  private static buildFullText(root: HTMLElement): string {
    const parts: string[] = [];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
      acceptNode: (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toUpperCase();
          if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue?.trim();
        if (text) {
          parts.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toUpperCase();
        if (["P", "DIV", "BR", "LI", "TR", "H1", "H2", "H3", "H4", "H5", "H6", "SECTION", "ARTICLE", "BLOCKQUOTE", "PRE", "CODE"].includes(tag)) {
          parts.push("\n");
        }
      }
      node = walker.nextNode();
    }

    return parts.join(" ").replace(/\n\s+/g, "\n").replace(/\n+/g, "\n\n").trim();
  }
}
