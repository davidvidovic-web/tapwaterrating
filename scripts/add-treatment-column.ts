import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function addColumn() {
  try {
    console.log("Adding treatment_process column to reviews table...");
    await client.execute("ALTER TABLE reviews ADD COLUMN treatment_process text");
    console.log("✓ Column added successfully!");
  } catch (error: any) {
    if (error.message?.includes("duplicate column name")) {
      console.log("✓ Column already exists!");
    } else {
      console.error("Error:", error);
      throw error;
    }
  } finally {
    client.close();
  }
}

addColumn();
