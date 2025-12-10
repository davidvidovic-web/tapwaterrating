import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { cities, reviews, helpfulVotes } from "../src/db/schema";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function clearData() {
  try {
    console.log("Clearing all data from database...");
    
    // Delete in order of foreign key dependencies
    await db.delete(helpfulVotes);
    console.log("✓ Cleared helpful_votes");
    
    await db.delete(reviews);
    console.log("✓ Cleared reviews");
    
    await db.delete(cities);
    console.log("✓ Cleared cities");
    
    console.log("\n✅ Database cleared successfully!");
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  } finally {
    client.close();
  }
}

clearData();
