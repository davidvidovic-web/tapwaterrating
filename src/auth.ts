import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/db/schema";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Create database connection with environment variables
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = url && authToken
  ? drizzle(
      createClient({
        url,
        authToken,
      }),
      { schema }
    )
  : null;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: db ? DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) : undefined,
  session: {
    strategy: "jwt", // Use JWT for credentials provider
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          if (!db) {
            return null;
          }
          
          // Check if user exists in database
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .get();
            
          if (!user || !user.password) {
            return null;
          }
          
          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password as string, user.password);
          if (!passwordMatch) {
            return null;
          }
          
          // Check if user has admin role
          if (user.role !== "admin") {
            return null;
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    session: async ({ session, user, token }) => {
      if (session?.user) {
        session.user.id = user?.id || token?.sub || "";
        
        // Get user role from database or token
        if (user?.role) {
          session.user.role = user.role;
        } else if (token?.role) {
          session.user.role = token.role;
        } else {
          // Fallback: check database for role
          try {
            if (db) {
              const dbUser = await db
                .select({ role: users.role })
                .from(users)
                .where(eq(users.id, session.user.id))
                .get();
              session.user.role = dbUser?.role || "user";
            } else {
              session.user.role = "user";
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
            session.user.role = "user";
          }
        }
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
  },
});
