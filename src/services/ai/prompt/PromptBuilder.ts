import type { Conversation } from "../../conversation";
import type { Prompt } from "./PromptTypes";
import { PromptTemplates } from "./PromptTemplates";

export class PromptBuilder {
  /**
   * Constructs a provider-agnostic Prompt from a Conversation.
   * Ensures consistent formatting, ordering, and role assignment.
   */
  static buildPrompt(conversation: Conversation): Prompt {
    const system = PromptTemplates.DEFAULT_SUMMARIZATION;

    // Construct the user prompt by cleanly formatting the conversation history
    const formattedMessages = conversation.messages.map((msg) => {
      const role = msg.role.toUpperCase();
      return `[${role}]:\n${msg.content}`;
    });

    const user = `Here is the conversation to summarize (ID: ${conversation.id}):\n\n${formattedMessages.join("\n\n---\n\n")}`;

    return {
      system,
      user,
    };
  }
}
