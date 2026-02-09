import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { createFile, getFilesByUserId } from "./db";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";
import { nanoid } from "nanoid";

export const advancedRouter = router({
  // Upload and analyze file
  uploadFile: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string(), // base64 encoded
        mimeType: z.string(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 content
      const buffer = Buffer.from(input.content, "base64");
      const size = buffer.length;

      // Generate unique file key
      const fileKey = `${ctx.user.id}/files/${nanoid()}-${input.filename}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Extract text content for searchable files
      let extractedText = null;
      if (input.mimeType === "text/plain" || input.mimeType === "text/markdown") {
        extractedText = buffer.toString("utf-8");
      } else if (input.mimeType === "application/json") {
        try {
          extractedText = JSON.stringify(JSON.parse(buffer.toString("utf-8")), null, 2);
        } catch {
          extractedText = buffer.toString("utf-8");
        }
      }

      // Save file metadata to database
      const fileId = await createFile({
        userId: ctx.user.id,
        conversationId: input.conversationId,
        filename: input.filename,
        fileKey,
        url,
        mimeType: input.mimeType,
        size,
        extractedText,
      });

      return {
        id: fileId,
        url,
        extractedText,
      };
    }),

  // Get user files
  getUserFiles: protectedProcedure.query(async ({ ctx }) => {
    return getFilesByUserId(ctx.user.id);
  }),

  // Generate image from text
  generateImage: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await generateImage({
          prompt: input.prompt,
        });

        // Save generated image to user's files
        if (result.url) {
          const fileKey = `${ctx.user.id}/generated/${nanoid()}.png`;
          await createFile({
            userId: ctx.user.id,
            conversationId: input.conversationId,
            filename: `generated-${Date.now()}.png`,
            fileKey,
            url: result.url,
            mimeType: "image/png",
            size: 0, // Size unknown for generated images
            extractedText: `Generated from prompt: ${input.prompt}`,
          });
        }

        return result;
      } catch (error) {
        console.error("[AdvancedRouter] Image generation error:", error);
        throw new Error("Failed to generate image");
      }
    }),

  // Transcribe audio to text
  transcribeAudio: protectedProcedure
    .input(
      z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
        });

        // Check for transcription error
        if ('error' in result) {
          throw new Error(result.error);
        }

        return {
          text: result.text,
          language: result.language,
        };
      } catch (error) {
        console.error("[AdvancedRouter] Transcription error:", error);
        throw new Error("Failed to transcribe audio");
      }
    }),

  // Upload audio file and transcribe
  uploadAndTranscribe: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string(), // base64 encoded audio
        mimeType: z.string(),
        language: z.string().optional(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 content
      const buffer = Buffer.from(input.content, "base64");
      const size = buffer.length;

      // Check file size (16MB limit)
      const MAX_SIZE = 16 * 1024 * 1024; // 16MB
      if (size > MAX_SIZE) {
        throw new Error("Audio file too large (max 16MB)");
      }

      // Generate unique file key
      const fileKey = `${ctx.user.id}/audio/${nanoid()}-${input.filename}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Transcribe audio
      const transcription = await transcribeAudio({
        audioUrl: url,
        language: input.language,
      });

      // Check for transcription error
      if ('error' in transcription) {
        throw new Error(transcription.error);
      }

      // Save file metadata to database
      await createFile({
        userId: ctx.user.id,
        conversationId: input.conversationId,
        filename: input.filename,
        fileKey,
        url,
        mimeType: input.mimeType,
        size,
        extractedText: transcription.text,
      });

      return {
        url,
        text: transcription.text,
        language: transcription.language,
      };
    }),
});
