import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, benchmarkConfigs, benchmarkResults, BenchmarkConfig, BenchmarkResult, InsertBenchmarkConfig, InsertBenchmarkResult } from "../drizzle/schema";
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

// Benchmark Config queries
export async function createBenchmarkConfig(config: InsertBenchmarkConfig): Promise<BenchmarkConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(benchmarkConfigs).values(config);
  const insertedId = Number(result[0].insertId);
  
  const [inserted] = await db.select().from(benchmarkConfigs).where(eq(benchmarkConfigs.id, insertedId));
  return inserted;
}

export async function getBenchmarkConfigsByUserId(userId: number): Promise<BenchmarkConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(benchmarkConfigs).where(eq(benchmarkConfigs.userId, userId)).orderBy(desc(benchmarkConfigs.createdAt));
}

export async function getBenchmarkConfigById(id: number): Promise<BenchmarkConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [config] = await db.select().from(benchmarkConfigs).where(eq(benchmarkConfigs.id, id)).limit(1);
  return config;
}

export async function updateBenchmarkConfig(id: number, updates: Partial<InsertBenchmarkConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(benchmarkConfigs).set(updates).where(eq(benchmarkConfigs.id, id));
}

export async function deleteBenchmarkConfig(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(benchmarkConfigs).where(eq(benchmarkConfigs.id, id));
}

// Benchmark Result queries
export async function createBenchmarkResult(result: InsertBenchmarkResult): Promise<BenchmarkResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertResult = await db.insert(benchmarkResults).values(result);
  const insertedId = Number(insertResult[0].insertId);
  
  const [inserted] = await db.select().from(benchmarkResults).where(eq(benchmarkResults.id, insertedId));
  return inserted;
}

export async function getBenchmarkResultsByUserId(userId: number): Promise<BenchmarkResult[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(benchmarkResults).where(eq(benchmarkResults.userId, userId)).orderBy(desc(benchmarkResults.createdAt));
}

export async function getBenchmarkResultsByConfigId(configId: number): Promise<BenchmarkResult[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(benchmarkResults).where(eq(benchmarkResults.configId, configId)).orderBy(desc(benchmarkResults.createdAt));
}

export async function getBenchmarkResultById(id: number): Promise<BenchmarkResult | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [result] = await db.select().from(benchmarkResults).where(eq(benchmarkResults.id, id)).limit(1);
  return result;
}

export async function updateBenchmarkResult(id: number, updates: Partial<InsertBenchmarkResult>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(benchmarkResults).set(updates).where(eq(benchmarkResults.id, id));
}
