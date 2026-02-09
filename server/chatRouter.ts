import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createConversation,
  getConversationsByUserId,
  getConversationById,
  updateConversation,
  deleteConversation,
  searchConversations,
  createMessage,
  getMessagesByConversationId,
} from "./db";
import { chatCompletion, generateConversationTitle, AVAILABLE_MODELS, LLMModel } from "./llmService";
import { searchWeb } from "./webSearch";

export const chatRouter = router({
  // Get available LLM models
  getModels: protectedProcedure.query(() => {
    return Object.entries(AVAILABLE_MODELS).map(([key, value]) => ({
      id: key as LLMModel,
      ...value,
    }));
  }),

  // Get all conversations for the current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return getConversationsByUserId(ctx.user.id);
  }),

  // Get a specific conversation with messages
  getConversation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const conversation = await getConversationById(input.id, ctx.user.id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const messages = await getMessagesByConversationId(input.id);
      return { conversation, messages };
    }),

  // Create a new conversation
  createConversation: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        model: z.string().default("gpt-4.1-nano"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversationId = await createConversation({
        userId: ctx.user.id,
        title: input.title || "New Conversation",
        model: input.model,
      });

      return { id: conversationId };
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string(),
        includeWebSearch: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify conversation belongs to user
      const conversation = await getConversationById(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Save user message
      await createMessage({
        conversationId: input.conversationId,
        role: "user",
        content: input.message,
      });

      // Get conversation history
      const messages = await getMessagesByConversationId(input.conversationId);

      // Prepare messages for LLM
      const llmMessages = messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // Add web search context if requested
      let webSearchResults = null;
      if (input.includeWebSearch) {
        webSearchResults = await searchWeb(input.message);
        if (webSearchResults.length > 0) {
          const searchContext = webSearchResults
            .map((r) => `${r.title}: ${r.snippet} (${r.url})`)
            .join("\n\n");
          llmMessages.push({
            role: "system",
            content: `Web search results:\n${searchContext}`,
          });
        }
      }

      // Get AI response
      const response = await chatCompletion(llmMessages, conversation.model as LLMModel);

      // Save assistant message
      const assistantMessageId = await createMessage({
        conversationId: input.conversationId,
        role: "assistant",
        content: response.content,
        metadata: JSON.stringify({
          model: conversation.model,
          usage: response.usage,
        }),
      });

      // Update conversation title if this is the first message
      if (messages.length === 1) {
        const title = await generateConversationTitle(input.message);
        await updateConversation(input.conversationId, ctx.user.id, { title });
      }

      // Update conversation timestamp
      await updateConversation(input.conversationId, ctx.user.id, {});

      return {
        messageId: assistantMessageId,
        content: response.content,
        webSearchResults,
      };
    }),

  // Update conversation (title, favorite, tags)
  updateConversation: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        isFavorite: z.number().optional(),
        tags: z.string().optional(),
        model: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      await updateConversation(id, ctx.user.id, updates);
      return { success: true };
    }),

  // Delete conversation
  deleteConversation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteConversation(input.id, ctx.user.id);
      return { success: true };
    }),

  // Search conversations
  searchConversations: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      return searchConversations(ctx.user.id, input.query);
    }),

  // Web search
  webSearch: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchWeb(input.query);
    }),
});
