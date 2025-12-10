require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

async function test() {
  console.log("URL:", process.env.TURSO_DATABASE_URL ? "Set" : "Not Set");
  console.log("Token:", process.env.TURSO_AUTH_TOKEN ? "Set" : "Not Set");

  if (!process.env.TURSO_DATABASE_URL) {
    console.error("Missing URL");
    return;
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log("Connecting...");
    const rs = await client.execute("SELECT 1");
    console.log("Connected!", rs);
    
    console.log("Inserting anonymous user...");
    await client.execute({
      sql: `INSERT OR IGNORE INTO users (
        id, name, email, email_verified, image, review_count, is_verified, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      args: [
        "anonymous",
        "Anonymous User",
        "anonymous@example.com",
        null,
        null,
        0,
        0,
        Date.now(),
      ],
    });
    console.log("User inserted.");
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
