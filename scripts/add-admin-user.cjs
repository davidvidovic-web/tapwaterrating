const { db } = require("../src/db/client");
const { users } = require("../src/db/schema");
const { eq } = require("drizzle-orm");
const bcrypt = require("bcryptjs");

// Generate a random password
const generateRandomPassword = (length = 16) => {
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
  
  try {
    console.log("🔧 Setting up database for admin authentication...");
    
    // Add columns (ignore if they already exist)
    try {
      await db.run(`ALTER TABLE users ADD COLUMN password TEXT;`);
      console.log("✅ Added password column");
    } catch (err) {
      if (err.message?.includes("duplicate column")) {
        console.log("ℹ️  Password column already exists");
      } else {
        console.log("⚠️  Password column issue:", err.message);
      }
    }
    
    try {
      await db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';`);
      console.log("✅ Added role column");
    } catch (err) {
      if (err.message?.includes("duplicate column")) {
        console.log("ℹ️  Role column already exists");
      } else {
        console.log("⚠️  Role column issue:", err.message);
      }
    }
    
    // Check if admin user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    
    if (existingUser) {
      // Update existing user to be admin
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
        isVerified: 1,
        reviewCount: 0,
        createdAt: new Date(),
      });
      
      console.log("✅ Created new admin user");
    }
    
    console.log("\n🔐 ADMIN CREDENTIALS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:    ", email);
    console.log("Password: ", password);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
    console.log("💡 Login URL: http://localhost:3000/admin/login");
    console.log("🎯 Dashboard: http://localhost:3000/dashboard");
    
  } catch (error) {
    console.error("💥 Error:", error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  addAdminUser()
    .then(() => {
      console.log("\n🎉 Setup complete! You can now login as admin.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Setup failed:", error);
      process.exit(1);
    });
}

module.exports = addAdminUser;