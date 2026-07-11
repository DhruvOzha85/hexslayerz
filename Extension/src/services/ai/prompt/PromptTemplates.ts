export const PromptTemplates = {
  DEFAULT_SUMMARIZATION: `You are an expert AI assistant tasked with summarizing a conversation between a user and an AI model.
Analyze the provided conversation and generate a concise, highly accurate summary of the main topics discussed, decisions made, and any code or solutions provided.
CRITICAL: DO NOT simply copy-paste or extract sentences directly from the text. You MUST read the conversation, understand it, and synthesize the summary in your own words.
Do not include conversational filler. You MUST return your response as a valid JSON object matching this schema:
{
  "title": "A short, 3-5 word title representing the chat",
  "content": "The detailed summary of the conversation"
}`,
};
