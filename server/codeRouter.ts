import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { createCodeProject, getCodeProjects, getCodeProjectById, updateCodeProject, deleteCodeProject, createCodeFile, getCodeFilesByProjectId } from "./db";
import { nanoid } from "nanoid";

export const codeRouter = router({
  // Generate code from description
  generateCode: protectedProcedure
    .input(
      z.object({
        description: z.string(),
        language: z.string().default("javascript"),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const systemPrompt = `You are an expert code generator. Generate clean, well-documented, and production-ready code based on the user's description. 
        
Guidelines:
- Write code in ${input.language}
- Include comments explaining complex logic
- Follow best practices and conventions for the language
- Make the code modular and reusable
- Include error handling where appropriate
- If generating HTML/CSS/JS, create a complete working example`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.description },
          ],
        });

        const code = typeof response.choices[0].message.content === "string" 
          ? response.choices[0].message.content 
          : "";

        return {
          code,
          language: input.language,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("[CodeRouter] Code generation error:", error);
        throw new Error("Failed to generate code");
      }
    }),

  // Analyze and fix code
  analyzeCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.string(),
        issues: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const systemPrompt = `You are an expert code reviewer and debugger. Analyze the provided ${input.language} code and:
1. Identify any bugs or issues
2. Suggest improvements for performance, readability, and maintainability
3. Point out security vulnerabilities if any
4. Provide corrected code if needed

Format your response as:
## Issues Found
- Issue 1
- Issue 2

## Improvements
- Improvement 1
- Improvement 2

## Corrected Code
\`\`\`${input.language}
corrected code here
\`\`\``;

        const userMessage = input.issues 
          ? `Code:\n\`\`\`${input.language}\n${input.code}\n\`\`\`\n\nSpecific issues to check: ${input.issues}`
          : `Code:\n\`\`\`${input.language}\n${input.code}\n\`\`\``;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        const analysis = typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

        return { analysis };
      } catch (error) {
        console.error("[CodeRouter] Code analysis error:", error);
        throw new Error("Failed to analyze code");
      }
    }),

  // Explain code
  explainCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert programmer. Explain the provided code in clear, simple terms. Break it down into sections and explain what each part does." },
            { role: "user", content: `Explain this ${input.language} code:\n\`\`\`${input.language}\n${input.code}\n\`\`\`` },
          ],
        });

        const explanation = typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

        return { explanation };
      } catch (error) {
        console.error("[CodeRouter] Code explanation error:", error);
        throw new Error("Failed to explain code");
      }
    }),

  // Create a code project
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        language: z.string().default("javascript"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = await createCodeProject({
        userId: ctx.user.id,
        name: input.name,
        description: input.description || "",
        language: input.language,
      });

      return { id: projectId, name: input.name };
    }),

  // Get user's code projects
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return getCodeProjects(ctx.user.id);
  }),

  // Get specific project with files
  getProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getCodeProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      const files = await getCodeFilesByProjectId(input.projectId);
      return { ...project, files };
    }),

  // Update project
  updateProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await getCodeProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      await updateCodeProject(input.projectId, {
        name: input.name,
        description: input.description,
      });

      return { success: true };
    }),

  // Delete project
  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const project = await getCodeProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      await deleteCodeProject(input.projectId);
      return { success: true };
    }),

  // Create a file in a project
  createFile: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        filename: z.string(),
        content: z.string(),
        language: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await getCodeProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      const fileId = await createCodeFile({
        projectId: input.projectId,
        filename: input.filename,
        content: input.content,
        language: input.language,
      });

      return { id: fileId, filename: input.filename };
    }),

  // Get files in a project
  getFiles: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await getCodeProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or unauthorized");
      }

      return getCodeFilesByProjectId(input.projectId);
    }),
});
