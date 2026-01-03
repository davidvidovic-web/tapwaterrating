import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/db/schema";
import { users } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Create database connection directly with proper error handling
const createDbConnection = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }
  
  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN environment variable is not set");
  }
  
  return drizzle(
    createClient({
      url,
      authToken,
    }),
    { schema }
  );
};

// Generate a random password
const generateRandomPassword = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const addAdminUser = async () => {
  const email = "mail@davidvidovic.com";
  const password = generateRandomPassword(16);
  const hashedPassword = await bcrypt.hash(password, 12);
  
  let db;
  try {
    db = createDbConnection();
    console.log("✅ Database connection established");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Database connection failed:", errorMessage);
    console.log("\n💡 Make sure you have the following environment variables set:");
    console.log("   TURSO_DATABASE_URL=your_database_url");
    console.log("   TURSO_AUTH_TOKEN=your_auth_token");
    return;
  }
  
  try {
    // First, add the new columns to the users table if they don't exist
    console.log("Adding password and role columns to users table...");
    
    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN password TEXT;`);
      console.log("✅ Added password column");
    } catch (err: any) {
      if (err.message?.includes("duplicate column")) {
        console.log("ℹ️  Password column already exists");
      } else {
        console.log("⚠️  Could not add password column:", err.message);
      }
    }
    
    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';`);
      console.log("✅ Added role column");
    } catch (err: any) {
      if (err.message?.includes("duplicate column")) {
        console.log("ℹ️  Role column already exists");
      } else {
        console.log("⚠️  Could not add role column:", err.message);
      }
    }
    
    // Check if admin user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    
    if (existingUser) {
      // Update existing user to be admin with password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "admin",
          name: "David Vidovic",
        })
        .where(eq(users.email, email));
      
      console.log("✅ Updated existing user to admin");
    } else {
      // Create new admin user
      await db.insert(users).values({
        id: `admin_${Date.now()}`,
        email,
        name: "David Vidovic",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        reviewCount: 0,
        createdAt: new Date(),
      });
      
      console.log("✅ Created new admin user");
    }
    
    console.log("\n🔐 ADMIN CREDENTIALS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
    console.log("💡 You can now login at /admin/login");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  addAdminUser().then(() => {
    console.log("\n🎉 Admin user setup complete!");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
}

export default addAdminUser;