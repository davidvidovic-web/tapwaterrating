import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

async function applyMigration() {
  const client = createClient({
    url: url!,
    authToken: authToken!,
  });

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), "drizzle", "0004_content_tables.sql");
    const migrationSql = readFileSync(migrationPath, "utf-8");

    console.log("Applying content tables migration...");
    
    // Split by statement breakpoint and execute each statement
    const statements = migrationSql
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await client.execute(statement);
        console.log("✓ Executed:", statement.substring(0, 50) + "...");
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes("already exists")) {
          console.log("⊘ Skipped (already exists):", statement.substring(0, 50) + "...");
        } else {
          throw error;
        }
      }
    }

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("Error applying migration:", error);
    process.exit(1);
  }
}

applyMigration();
