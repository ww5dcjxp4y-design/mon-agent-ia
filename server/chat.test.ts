import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("chat router", () => {
  it("should get available LLM models", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const models = await caller.chat.getModels();

    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    
    const firstModel = models[0];
    expect(firstModel).toHaveProperty("id");
    expect(firstModel).toHaveProperty("name");
    expect(firstModel).toHaveProperty("description");
    expect(firstModel).toHaveProperty("maxTokens");
  });

  it("should create a new conversation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.createConversation({
      title: "Test Conversation",
      model: "gpt-4.1-nano",
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should get user conversations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    await caller.chat.createConversation({
      title: "Test Conversation",
      model: "gpt-4.1-nano",
    });

    const conversations = await caller.chat.getConversations();

    expect(conversations).toBeDefined();
    expect(Array.isArray(conversations)).toBe(true);
  });
});

describe("web search", () => {
  it("should perform web search", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.chat.webSearch({
      query: "artificial intelligence",
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    // Results may be empty if APIs are down, so we just check structure
  });
});
