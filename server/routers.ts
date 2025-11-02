import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { spawn } from "child_process";
import path from "path";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  benchmarkConfig: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const configs = await db.getBenchmarkConfigsByUserId(ctx.user.id);
      return configs.map(config => ({
        ...config,
        tasks: JSON.parse(config.tasks)
      }));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        apiUrl: z.string().min(1).max(512),
        timeout: z.number().int().min(10).max(600).default(120),
        numSamples: z.number().int().min(1).max(1000).default(50),
        tasks: z.array(z.string()).min(1)
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await db.createBenchmarkConfig({
          userId: ctx.user.id,
          name: input.name,
          apiUrl: input.apiUrl,
          timeout: input.timeout,
          numSamples: input.numSamples,
          tasks: JSON.stringify(input.tasks)
        });
        return {
          ...config,
          tasks: JSON.parse(config.tasks)
        };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        apiUrl: z.string().min(1).max(512).optional(),
        timeout: z.number().int().min(10).max(600).optional(),
        numSamples: z.number().int().min(1).max(1000).optional(),
        tasks: z.array(z.string()).min(1).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await db.getBenchmarkConfigById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.apiUrl) updates.apiUrl = input.apiUrl;
        if (input.timeout) updates.timeout = input.timeout;
        if (input.numSamples) updates.numSamples = input.numSamples;
        if (input.tasks) updates.tasks = JSON.stringify(input.tasks);

        await db.updateBenchmarkConfig(input.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const config = await db.getBenchmarkConfigById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        await db.deleteBenchmarkConfig(input.id);
        return { success: true };
      }),
  }),

  benchmarkResult: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const results = await db.getBenchmarkResultsByUserId(ctx.user.id);
      return results.map(result => ({
        ...result,
        results: result.results ? JSON.parse(result.results) : null
      }));
    }),

    getByConfigId: protectedProcedure
      .input(z.object({ configId: z.number() }))
      .query(async ({ ctx, input }) => {
        const config = await db.getBenchmarkConfigById(input.configId);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        const results = await db.getBenchmarkResultsByConfigId(input.configId);
        return results.map(result => ({
          ...result,
          results: result.results ? JSON.parse(result.results) : null
        }));
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await db.getBenchmarkResultById(input.id);
        if (!result || result.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        return {
          ...result,
          results: result.results ? JSON.parse(result.results) : null
        };
      }),

    run: protectedProcedure
      .input(z.object({ configId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const config = await db.getBenchmarkConfigById(input.configId);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        // Create a pending result record
        const result = await db.createBenchmarkResult({
          configId: config.id,
          userId: ctx.user.id,
          status: 'pending',
          startedAt: new Date()
        });

        // Run benchmark in background
        const scriptPath = path.join(process.cwd(), 'benchmarks', 'run_benchmark.py');
        const tasks = JSON.parse(config.tasks);
        
        const args = [
          scriptPath,
          '--api-url', config.apiUrl,
          '--samples', config.numSamples.toString(),
          '--timeout', config.timeout.toString(),
          '--tasks', ...tasks
        ];

        // Update status to running
        await db.updateBenchmarkResult(result.id, { status: 'running' });

        // Execute benchmark asynchronously
        const pythonProcess = spawn('python3.11', args, {
          env: { ...process.env }
        });
        
        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log(`[Benchmark ${result.id}] ${data}`);
        });

        pythonProcess.on('close', async (code) => {
          try {
            console.log(`[Benchmark ${result.id}] Process exited with code ${code}`);
            console.log(`[Benchmark ${result.id}] STDOUT length: ${stdout.length}`);
            
            if (code === 0 && stdout.trim()) {
              try {
                // Parse JSON from stdout
                const benchmarkData = JSON.parse(stdout.trim());
                
                if (benchmarkData.success && benchmarkData.results) {
                  await db.updateBenchmarkResult(result.id, {
                    status: 'completed',
                    results: JSON.stringify(benchmarkData.results),
                    completedAt: new Date()
                  });
                  console.log(`[Benchmark ${result.id}] ✓ Completed successfully`);
                } else {
                  await db.updateBenchmarkResult(result.id, {
                    status: 'failed',
                    errorMessage: benchmarkData.error || 'Unknown error',
                    completedAt: new Date()
                  });
                  console.log(`[Benchmark ${result.id}] ✗ Failed: ${benchmarkData.error}`);
                }
              } catch (parseError) {
                console.error(`[Benchmark ${result.id}] JSON parse error:`, parseError);
                await db.updateBenchmarkResult(result.id, {
                  status: 'failed',
                  errorMessage: `Failed to parse results: ${parseError}\nOutput: ${stdout.substring(0, 500)}`,
                  completedAt: new Date()
                });
              }
            } else {
              const errorMsg = stderr || `Process exited with code ${code}`;
              await db.updateBenchmarkResult(result.id, {
                status: 'failed',
                errorMessage: errorMsg.substring(0, 1000),
                completedAt: new Date()
              });
              console.log(`[Benchmark ${result.id}] ✗ Failed with code ${code}`);
            }
          } catch (error) {
            console.error(`[Benchmark ${result.id}] Error updating result:`, error);
            try {
              await db.updateBenchmarkResult(result.id, {
                status: 'failed',
                errorMessage: `Error processing results: ${error}`,
                completedAt: new Date()
              });
            } catch (dbError) {
              console.error(`[Benchmark ${result.id}] Failed to update DB:`, dbError);
            }
          }
        });

        pythonProcess.on('error', async (error) => {
          console.error(`[Benchmark ${result.id}] Process error:`, error);
          await db.updateBenchmarkResult(result.id, {
            status: 'failed',
            errorMessage: `Failed to start benchmark process: ${error.message}`,
            completedAt: new Date()
          });
        });

        return { 
          success: true, 
          resultId: result.id,
          message: 'Benchmark started in background'
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
