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

describe("code router", () => {
  it("should generate code from description", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.code.generateCode({
      description: "Create a function that validates email addresses",
      language: "javascript",
    });

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(typeof result.code).toBe("string");
    expect(result.code.length).toBeGreaterThan(0);
    expect(result.language).toBe("javascript");
  }, 30000);

  it("should analyze code", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testCode = `
    function add(a, b) {
      return a + b;
    }
    `;

    const result = await caller.code.analyzeCode({
      code: testCode,
      language: "javascript",
    });

    expect(result).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(typeof result.analysis).toBe("string");
  }, 30000);

  it("should create a code project", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.code.createProject({
      name: "Test Project",
      language: "javascript",
      description: "A test project",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
    expect(result.name).toBe("Test Project");
  });

  it("should get user projects", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    await caller.code.createProject({
      name: "Test Project",
      language: "javascript",
    });

    const projects = await caller.code.getProjects();

    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
  });

  it("should explain code", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testCode = `
    const arr = [1, 2, 3];
    const doubled = arr.map(x => x * 2);
    `;

    const result = await caller.code.explainCode({
      code: testCode,
      language: "javascript",
    });

    expect(result).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(typeof result.explanation).toBe("string");
  }, 30000);
});
