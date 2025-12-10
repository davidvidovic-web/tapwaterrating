require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log("Clearing database...");
    await client.execute("DELETE FROM helpful_votes");
    await client.execute("DELETE FROM reviews");
    await client.execute("DELETE FROM cities");
    await client.execute("DELETE FROM accounts");
    await client.execute("DELETE FROM sessions");
    await client.execute("DELETE FROM verification_tokens");
    await client.execute("DELETE FROM users");
    console.log("Database cleared.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    client.close();
  }
}

main();
