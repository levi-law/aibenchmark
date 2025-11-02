import { drizzle } from "drizzle-orm/mysql2";
import { benchmarkConfigs } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding database with OpenAI configuration...");

  try {
    // Check if OpenAI config already exists
    const existing = await db.select().from(benchmarkConfigs).limit(1);
    
    if (existing.length > 0) {
      console.log("Database already seeded. Skipping...");
      return;
    }

    // Insert OpenAI configuration
    await db.insert(benchmarkConfigs).values({
      userId: 1, // Admin user
      name: "OpenAI GPT-4",
      apiUrl: "https://api.openai.com",
      timeout: 120,
      numSamples: 10,
      tasks: JSON.stringify(["hellaswag", "arc_easy", "truthfulqa_mc2"])
    });

    console.log("✓ Successfully seeded OpenAI configuration");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
