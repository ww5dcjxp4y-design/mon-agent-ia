import { invokeLLM } from "./_core/llm";

export type LLMModel = "gpt-4.1-nano" | "gemini-2.5-flash" | "gpt-4o-mini";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

/**
 * Available LLM models with their configurations
 */
export const AVAILABLE_MODELS: Record<LLMModel, { name: string; description: string; maxTokens: number }> = {
  "gpt-4.1-nano": {
    name: "GPT-4.1 Nano",
    description: "Fast and efficient for most tasks",
    maxTokens: 4096,
  },
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    description: "Google's latest fast model",
    maxTokens: 8192,
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    description: "Balanced performance and capability",
    maxTokens: 16384,
  },
};

/**
 * Send a chat completion request to the specified LLM model
 */
export async function chatCompletion(
  messages: LLMMessage[],
  model: LLMModel = "gpt-4.1-nano",
  temperature = 0.7
) {
  try {
    const response = await invokeLLM({
      messages,
    });

    const content = response.choices[0]?.message?.content;
    const textContent = typeof content === "string" ? content : "";
    
    return {
      content: textContent,
      model,
      usage: response.usage,
    };
  } catch (error) {
    console.error("[LLM] Chat completion error:", error);
    throw new Error("Failed to generate response from LLM");
  }
}

/**
 * Get chat completion response (non-streaming)
 * For streaming effect on frontend, we'll send the full response and let the UI animate it
 */
export async function chatCompletionForStream(
  messages: LLMMessage[],
  model: LLMModel = "gpt-4.1-nano",
  temperature = 0.7
) {
  // Use the same function as chatCompletion
  return chatCompletion(messages, model, temperature);
}

/**
 * Generate a title for a conversation based on the first message
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const response = await chatCompletion(
      [
        {
          role: "system",
          content: "Generate a short, concise title (max 6 words) for this conversation. Only return the title, nothing else.",
        },
        {
          role: "user",
          content: firstMessage,
        },
      ],
      "gpt-4.1-nano",
      0.3
    );

    const content = typeof response.content === "string" ? response.content : "";
    return content.trim().replace(/^["']|["']$/g, ""); // Remove quotes if present
  } catch (error) {
    console.error("[LLM] Title generation error:", error);
    return "New Conversation";
  }
}
