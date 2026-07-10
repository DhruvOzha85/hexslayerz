// LSCS v2 — Website Classifier
import { WebsiteTypes } from "./ContentExtractionTypes";
import type { WebsiteType } from "./ContentExtractionTypes";

/**
 * Domain and URL-based classification of websites
 * to apply the correct extraction strategy.
 */
export class WebsiteClassifier {
  private static readonly WIKIPEDIA_HOSTS = [
    "en.wikipedia.org",
    "wikipedia.org",
  ];

  private static readonly GITHUB_HOSTS = ["github.com", "www.github.com"];

  private static readonly DOC_HOSTS = [
    "developer.mozilla.org",
    "docs.python.org",
    "devdocs.io",
    "readthedocs.io",
    "docs.microsoft.com",
    "learn.microsoft.com",
    "docs.github.com",
    "docs.oracle.com",
    "docs.aws.amazon.com",
    "cloud.google.com",
    "firebase.google.com",
    "reactjs.org",
    "vuejs.org",
    "angular.io",
    "nextjs.org",
    "nodejs.org",
    "typescriptlang.org",
    "tailwindcss.com",
    "vitejs.dev",
  ];

  /**
   * Classifies a URL into a known website type.
   */
  static classify(url: string): WebsiteType {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "");

      // Wikipedia
      if (
        this.WIKIPEDIA_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
      ) {
        return WebsiteTypes.WIKIPEDIA;
      }

      // GitHub — only README/docs pages, not code views
      if (this.GITHUB_HOSTS.some((h) => host === h)) {
        return WebsiteTypes.GITHUB;
      }

      // Documentation sites
      if (
        this.DOC_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ||
        host.endsWith(".readthedocs.io") ||
        parsed.pathname.includes("/docs/") ||
        parsed.pathname.includes("/documentation/")
      ) {
        return WebsiteTypes.DOCUMENTATION;
      }

      // Check page structure for blog indicators
      if (this.isBlogLike()) {
        return WebsiteTypes.BLOG;
      }

      return WebsiteTypes.GENERIC;
    } catch {
      return WebsiteTypes.GENERIC;
    }
  }

  /**
   * Heuristic: detect blog-like pages via DOM signals.
   */
  private static isBlogLike(): boolean {
    const signals = [
      // Common blog semantic elements
      !!document.querySelector("article"),
      !!document.querySelector("[class*='post']"),
      !!document.querySelector("[class*='blog']"),
      !!document.querySelector("[class*='article']"),
      !!document.querySelector("time[datetime]"),
      !!document.querySelector("[class*='author']"),
      // Meta tags
      !!document.querySelector('meta[property="article:published_time"]'),
      !!document.querySelector('meta[property="og:type"][content="article"]'),
    ];

    // If 2+ blog signals are present, classify as blog
    return signals.filter(Boolean).length >= 2;
  }
}
