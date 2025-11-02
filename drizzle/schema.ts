import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Benchmark configurations created by users
 */
export const benchmarkConfigs = mysqlTable("benchmarkConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  apiUrl: varchar("apiUrl", { length: 512 }).notNull(),
  timeout: int("timeout").default(120).notNull(),
  numSamples: int("numSamples").default(50).notNull(),
  tasks: text("tasks").notNull(), // JSON array of task names
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BenchmarkConfig = typeof benchmarkConfigs.$inferSelect;
export type InsertBenchmarkConfig = typeof benchmarkConfigs.$inferInsert;

/**
 * Benchmark execution results
 */
export const benchmarkResults = mysqlTable("benchmarkResults", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  results: text("results"), // JSON object with detailed results
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BenchmarkResult = typeof benchmarkResults.$inferSelect;
export type InsertBenchmarkResult = typeof benchmarkResults.$inferInsert;
