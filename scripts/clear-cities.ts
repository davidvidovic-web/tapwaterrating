import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function clearCities() {
  try {
    console.log("Clearing all cities from database...");
    
    // First, delete all reviews (foreign key constraint)
    await client.execute("DELETE FROM reviews");
    console.log("✓ Deleted all reviews");
    
    // Then delete all cities
    await client.execute("DELETE FROM cities");
    console.log("✓ Deleted all cities");
    
    console.log("\n✅ Database cleared successfully!");
    console.log("You can now start fresh with geocoded locations.");
    
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

clearCities();
