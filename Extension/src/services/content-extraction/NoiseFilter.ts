// Context(AI) — Noise Filter
import type { WebsiteType } from "./ContentExtractionTypes";

/**
 * Strips noise elements from a cloned DOM tree.
 * Operates on a deep-cloned document to avoid mutating the live page.
 */
export class NoiseFilter {
  /** Tag names to always remove */
  private static readonly NOISE_TAGS: string[] = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "video",
    "audio",
    "embed",
    "object",
    "form",
    "input",
    "textarea",
    "select",
    "button",
  ];

  /** Semantic tags that are structural noise */
  private static readonly STRUCTURAL_NOISE_TAGS: string[] = [
    "nav",
    "footer",
    "header",
  ];

  /** Class/ID substrings that indicate noise */
  private static readonly NOISE_IDENTIFIERS: string[] = [
    "sidebar",
    "side-bar",
    "side_bar",
    "ad-",
    "ads-",
    "advert",
    "banner",
    "popup",
    "pop-up",
    "modal",
    "cookie",
    "consent",
    "newsletter",
    "subscribe",
    "signup",
    "sign-up",
    "social",
    "share",
    "sharing",
    "comment",
    "disqus",
    "related",
    "recommend",
    "suggested",
    "trending",
    "popular",
    "promo",
    "promotion",
    "sponsor",
    "widget",
    "toolbar",
    "breadcrumb",
    "pagination",
    "toc",
    "table-of-contents",
    "search",
    "menu",
    "dropdown",
    "mega-menu",
    "skip-link",
    "print",
    "hidden",
    "overlay",
    "toast",
    "snackbar",
    "notification",
    "alert-banner",
  ];

  /**
   * Filter noise from a cloned DOM root element.
   * Returns the cleaned root for downstream extraction.
   */
  static filter(root: Element, websiteType: WebsiteType): Element {
    // 1. Remove non-content tags
    this.removeByTagName(root, this.NOISE_TAGS);

    // 2. Remove structural noise tags (nav, footer, header)
    //    Exception: Wikipedia headers contain useful info
    if (websiteType !== "wikipedia") {
      this.removeByTagName(root, this.STRUCTURAL_NOISE_TAGS);
    } else {
      this.removeByTagName(root, ["nav", "footer"]);
    }

    // 3. Remove aside elements (sidebars)
    this.removeByTagName(root, ["aside"]);

    // 4. Remove elements by class/id noise patterns
    this.removeByIdentifiers(root);

    // 5. Remove hidden elements
    this.removeHiddenElements(root);

    // 6. Remove empty containers
    this.removeEmptyContainers(root);

    return root;
  }

  private static removeByTagName(root: Element, tags: string[]): void {
    for (const tag of tags) {
      const elements = root.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    }
  }

  private static removeByIdentifiers(root: Element): void {
    const allElements = root.querySelectorAll("*");

    allElements.forEach((el) => {
      const className = (el.className || "").toString().toLowerCase();
      const id = (el.id || "").toLowerCase();
      const role = (el.getAttribute("role") || "").toLowerCase();
      const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();

      const combined = `${className} ${id} ${role} ${ariaLabel}`;

      const isNoise = this.NOISE_IDENTIFIERS.some((pattern) =>
        combined.includes(pattern),
      );

      if (isNoise) {
        el.remove();
      }
    });
  }

  private static removeHiddenElements(root: Element): void {
    const allElements = root.querySelectorAll("*");

    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Check inline style for display:none or visibility:hidden
      if (htmlEl.style) {
        if (
          htmlEl.style.display === "none" ||
          htmlEl.style.visibility === "hidden"
        ) {
          el.remove();
          return;
        }
      }

      // Check aria-hidden
      if (el.getAttribute("aria-hidden") === "true") {
        el.remove();
      }
    });
  }

  private static removeEmptyContainers(root: Element): void {
    const containers = root.querySelectorAll("div, span, section, article");

    containers.forEach((el) => {
      const text = (el.textContent || "").trim();
      if (text.length === 0 && el.querySelectorAll("img, table").length === 0) {
        el.remove();
      }
    });
  }
}
