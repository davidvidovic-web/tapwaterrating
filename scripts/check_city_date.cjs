require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log("Fetching Riyadh city data...");
    const rs = await client.execute("SELECT id, last_updated, created_at FROM cities WHERE id = 'riyadh'");
    console.log("Riyadh:", rs.rows[0]);
    
    const lastUpdated = rs.rows[0].last_updated;
    console.log("last_updated raw:", lastUpdated);
    console.log("last_updated as Date:", new Date(lastUpdated));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    client.close();
  }
}

main();
