export const PromptTemplates = {
  DEFAULT_SUMMARIZATION: `You are an expert AI assistant tasked with summarizing a conversation between a user and an AI model.
Analyze the provided conversation and generate a concise, highly accurate summary of the main topics discussed, decisions made, and any code or solutions provided.
Do not include conversational filler. You MUST return your response as a valid JSON object matching this schema:
{
  "title": "A short, 3-5 word title representing the chat",
  "content": "The detailed summary of the conversation"
}`,
};
