import { TabService } from "../chrome/TabService";

// --- TYPES ---
export const ConversationRole = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export type ConversationRole =
  (typeof ConversationRole)[keyof typeof ConversationRole];

export interface ConversationMessage {
  id: string;
  index: number;
  role: ConversationRole;
  content: string;
}

export interface Conversation {
  id: string;
  source: "chatgpt";
  url: string;
  extractedAt: number;
  messageCount: number;
  messages: ConversationMessage[];
}

export type SerializationResult =
  | { success: true; data: Conversation }
  | { success: false; error: string };

export interface ConversationDetectionResult {
  supported: boolean;
  conversationFound: boolean;
  url: string;
  conversationRoot: Element | null;
}

export type SerializableDetectionResult = Omit<
  ConversationDetectionResult,
  "conversationRoot"
>;

// --- DETECTOR ---
export class ConversationDetector {
  static detect(): ConversationDetectionResult {
    const url = window.location.href;
    const supported = TabService.isChatGPT(url);

    if (!supported) {
      return { supported, conversationFound: false, url, conversationRoot: null };
    }

    const root = document.querySelector("main");
    return { supported, conversationFound: !!root, url, conversationRoot: root };
  }
}

// --- EXTRACTOR ---
export class ConversationExtractor {
  static extract(): ConversationMessage[] {
    const messages: ConversationMessage[] = [];
    const messageElements = document.querySelectorAll<HTMLElement>("[data-message-author-role]");

    messageElements.forEach((el, index) => {
      const rawRole = el.getAttribute("data-message-author-role");
      const role = rawRole === "user" ? ConversationRole.USER : ConversationRole.ASSISTANT;
      const content = el.innerText || el.textContent || "";
      const id = el.id || `msg-${index}`;
      messages.push({ id, index, role, content });
    });

    return messages;
  }
}

// --- CLEANER ---
export class ConversationCleaner {
  static clean(messages: ConversationMessage[]): ConversationMessage[] {
    return messages.map((msg) => ({
      ...msg,
      content: this.cleanContent(msg.content),
    }));
  }

  private static cleanContent(raw: string): string {
    if (!raw) return "";
    let cleaned = raw;
    cleaned = cleaned.replace(/\r\n/g, "\n");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    cleaned = cleaned.trim();
    return cleaned;
  }
}

// --- SERIALIZER ---
export class ConversationSerializer {
  static serialize(messages: ConversationMessage[], url: string): SerializationResult {
    if (!messages || messages.length === 0) {
      return { success: false, error: "Cannot serialize an empty conversation." };
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]!;
      if (!msg.id) return { success: false, error: `Message at index ${i} is missing an ID.` };
      if (msg.index !== i) return { success: false, error: `Message index mismatch at ${i} (found ${msg.index}).` };
      if (!Object.values(ConversationRole).includes(msg.role)) return { success: false, error: `Invalid role '${msg.role}' at index ${i}.` };
      if (typeof msg.content !== "string") return { success: false, error: `Message content is not a string at index ${i}.` };
    }

    const conversation: Conversation = {
      id: crypto.randomUUID ? crypto.randomUUID() : `context-ai-${Date.now()}`,
      source: "chatgpt",
      url,
      extractedAt: Date.now(),
      messageCount: messages.length,
      messages: [...messages],
    };

    return { success: true, data: conversation };
  }
}
