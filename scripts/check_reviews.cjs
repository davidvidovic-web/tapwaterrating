require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log("Fetching reviews...");
    const rs = await client.execute("SELECT * FROM reviews LIMIT 10");
    console.log("Reviews found:", rs.rows.length);
    console.log(JSON.stringify(rs.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    client.close();
  }
}

main();
