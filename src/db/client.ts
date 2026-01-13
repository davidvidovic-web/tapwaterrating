import { drizzle } from "drizzle-orm/libsql";
import { createClient, Client } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;

function getClient() {
  if (!url || !authToken) {
    return null;
  }
  
  if (!client) {
    client = createClient({
      url,
      authToken,
      syncUrl: url,
      syncInterval: 60,
    });
  }
  
  return client;
}

const libsqlClient = getClient();

export const db = libsqlClient ? drizzle(libsqlClient, { schema }) : null;
