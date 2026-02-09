import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { conversations, messages, files, Conversation, Message, File, InsertConversation, InsertMessage, InsertFile } from "../drizzle/schema";
import { desc, and, like, or, sql } from "drizzle-orm";

// ============ Conversations ============

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data);
  return result[0].insertId;
}

export async function getConversationsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

export async function getConversationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function updateConversation(id: number, userId: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(conversations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function searchConversations(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(conversations)
    .where(and(
      eq(conversations.userId, userId),
      or(
        like(conversations.title, `%${query}%`),
        like(conversations.tags, `%${query}%`)
      )
    ))
    .orderBy(desc(conversations.updatedAt))
    .limit(20);
}

// ============ Messages ============

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ============ Files ============

export async function createFile(data: InsertFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(files).values(data);
  return result[0].insertId;
}

export async function getFilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(files)
    .where(eq(files.userId, userId))
    .orderBy(desc(files.createdAt));
}

export async function getFilesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(files)
    .where(eq(files.conversationId, conversationId))
    .orderBy(files.createdAt);
}

// ============ Code Projects ============

import { codeProjects, codeFiles, CodeProject, CodeFile, InsertCodeProject, InsertCodeFile } from "../drizzle/schema";

export async function createCodeProject(data: InsertCodeProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(codeProjects).values(data);
  return result[0].insertId;
}

export async function getCodeProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(codeProjects)
    .where(eq(codeProjects.userId, userId))
    .orderBy(desc(codeProjects.updatedAt));
}

export async function getCodeProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(codeProjects)
    .where(eq(codeProjects.id, id))
    .limit(1);
  
  return result[0];
}

export async function updateCodeProject(id: number, data: Partial<InsertCodeProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(codeProjects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(codeProjects.id, id));
}

export async function deleteCodeProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(codeProjects)
    .where(eq(codeProjects.id, id));
}

// ============ Code Files ============

export async function createCodeFile(data: InsertCodeFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(codeFiles).values(data);
  return result[0].insertId;
}

export async function getCodeFilesByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(codeFiles)
    .where(eq(codeFiles.projectId, projectId))
    .orderBy(codeFiles.createdAt);
}
