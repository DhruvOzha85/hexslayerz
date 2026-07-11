export interface ReadItem {
  text: string;
  range: Range;
  container: HTMLElement;
}

export class HighlightManager {
  private static styleElement: HTMLStyleElement | null = null;

  /**
   * Initializes the highlight CSS style sheet in the webpage document.
   */
  static initStyle() {
    if (this.styleElement) return;

    const style = document.createElement("style");
    style.id = "context-ai-highlight-styles";
    style.textContent = `
      ::highlight(context-ai-sentence) {
        background-color: rgba(124, 58, 237, 0.25) !important;
        border-bottom: 2px solid rgba(139, 92, 246, 0.6) !important;
        color: inherit !important;
      }
    `;
    document.head.appendChild(style);
    this.styleElement = style;
  }

  /**
   * Cleans up styling.
   */
  static destroyStyle() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }

  /**
   * Scrapes the page DOM for readable text nodes and parses them into sentence ranges.
   */
  static parsePage(): ReadItem[] {
    this.initStyle();
    const readItems: ReadItem[] = [];

    // Focus on main readable areas
    let root: HTMLElement = document.body;
    const mainContent = document.querySelector("article, main, .markdown-body, #content");
    if (mainContent) {
      root = mainContent as HTMLElement;
    }

    const textNodes = this.getReadableTextNodes(root);

    // Split text nodes into sentence ranges
    textNodes.forEach(({ node, container }) => {
      const text = node.nodeValue || "";
      const sentenceRegex = /[^.!?\n]+([.!?\n]|$)/g;
      let match;

      while ((match = sentenceRegex.exec(text)) !== null) {
        const sentenceText = match[0].trim();
        if (sentenceText.length < 3) continue; // Skip extremely short items (like lonely punctuation or symbols)

        try {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);

          readItems.push({
            text: sentenceText,
            range,
            container,
          });
        } catch (e) {
          // ignore invalid range setups (can happen if offsets drift)
        }
      }
    });

    return readItems;
  }

  /**
   * Applies CSS Custom Highlight to the given range and clears previous highlights.
   */
  static highlightRange(range: Range) {
    if (!(window as any).CSS || !(window as any).CSS.highlights) {
      console.warn("[HighlightManager] CSS Custom Highlight API not supported in this browser.");
      return;
    }

    try {
      // Clear previous
      (window as any).CSS.highlights.delete("context-ai-sentence");

      // Set new
      const highlight = new (window as any).Highlight(range);
      (window as any).CSS.highlights.set("context-ai-sentence", highlight);
    } catch (e) {
      console.error("[HighlightManager] Failed to apply highlight range:", e);
    }
  }

  /**
   * Clears any active highlight.
   */
  static clearHighlight() {
    if ((window as any).CSS && (window as any).CSS.highlights) {
      (window as any).CSS.highlights.delete("context-ai-sentence");
    }
  }

  /**
   * Smoothly scrolls the viewport to center the highlighted element.
   */
  static scrollToRange(range: Range) {
    try {
      const rect = range.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const targetTop = window.scrollY + rect.top - (viewHeight / 2) + (rect.height / 2);

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    } catch (e) {
      // fallback scroll to parent
      try {
        const parent = range.startContainer.parentElement;
        if (parent) {
          parent.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch (err) {
        // ignore
      }
    }
  }

  /**
   * DOM tree walker to isolate visible, readable text nodes.
   */
  private static getReadableTextNodes(root: HTMLElement): { node: Text; container: HTMLElement }[] {
    const nodes: { node: Text; container: HTMLElement }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toUpperCase();
        // Ignore style, scripts, navigation, overlays, and our injected UI elements
        if (
          [
            "SCRIPT", "STYLE", "NOSCRIPT", "NAV", "HEADER", "FOOTER",
            "SVG", "BUTTON", "INPUT", "TEXTAREA", "OPTION", "SELECT"
          ].includes(tag)
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        // Avoid injected classes from this extension
        if (
          parent.closest(".context-ai-ignore") ||
          parent.closest("#context-ai-floating-menu") ||
          parent.closest("#context-ai-explanation-card") ||
          parent.closest("#context-ai-reader-toolbar")
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        // Must be visible text
        const textVal = node.nodeValue?.trim();
        if (!textVal) return NodeFilter.FILTER_SKIP;

        // Parent must be laid out / visible
        const rect = parent.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          return NodeFilter.FILTER_SKIP;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node = walker.nextNode();
    while (node) {
      nodes.push({ node: node as Text, container: node.parentElement! });
      node = walker.nextNode();
    }

    return nodes;
  }
}
