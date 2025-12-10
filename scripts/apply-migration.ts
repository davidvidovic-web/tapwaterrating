import { createClient } from "@libsql/client";
import "dotenv/config";

async function applyMigration() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log("Applying migration...");
    
    // Add latitude and longitude columns with default values
    await client.execute("ALTER TABLE reviews ADD COLUMN latitude REAL NOT NULL DEFAULT 0");
    console.log("✓ Added latitude column");
    
    await client.execute("ALTER TABLE reviews ADD COLUMN longitude REAL NOT NULL DEFAULT 0");
    console.log("✓ Added longitude column");
    
    await client.execute("CREATE INDEX review_geo_idx ON reviews (latitude, longitude)");
    console.log("✓ Created geographic index");
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

applyMigration();
