# Can I Drink It? - Technical Implementation Guide

## 🏗️ Architecture Overview

### Technology Stack

```
Frontend:
├── Next.js 14+ (App Router)
├── TypeScript
├── MapLibre GL JS (open-source maps)
├── Tailwind CSS
└── shadcn/ui (component library)

Backend:
├── Next.js API Routes (serverless)
├── Turso (LibSQL - distributed SQLite)
├── Drizzle ORM
└── NextAuth.js v5 (authentication)

Deployment:
├── Vercel (frontend + API routes)
└── Turso Cloud (database)

External Services:
├── Mapbox/MapTiler (map tiles)
└── Nominatim (geocoding - free OSM)
```

---

## 🚀 Project Setup

### Prerequisites

```bash
# Required versions
Node.js >= 18.x
npm >= 9.x or pnpm >= 8.x
```

### Step 1: Initialize Next.js Project

```bash
# Create new Next.js app
npx create-next-app@latest canidrinkit

# Select the following options:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ src/ directory: Yes
# ✓ App Router: Yes
# ✓ Turbopack: No (optional)
# ✓ Customize import alias: No

cd canidrinkit
```

### Step 2: Install Core Dependencies

```bash
# Database & ORM
npm install @libsql/client drizzle-orm
npm install -D drizzle-kit

# Maps
npm install maplibre-gl
npm install -D @types/maplibre-gl

# Authentication
npm install next-auth@beta
npm install @auth/drizzle-adapter

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Data fetching
npm install swr

# Utilities
npm install zod
npm install date-fns
npm install nanoid
```

### Step 3: Setup Turso Database

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso  # macOS
# or
curl -sSfL https://get.tur.so/install.sh | bash  # Linux/WSL

# Login & create database
turso auth login
turso db create canidrinkit

# Get database URL and auth token
turso db show canidrinkit --url
turso db tokens create canidrinkit

# Create .env.local file
touch .env.local
```

### Step 4: Environment Variables

```env
# .env.local

# Turso Database
TURSO_DATABASE_URL=libsql://canidrinkit-[your-name].turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Map Provider (choose one)
NEXT_PUBLIC_MAPTILER_API_KEY=your-maptiler-key
# or
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

```

---

## 📦 Database Schema

### Drizzle Configuration

**File: `drizzle.config.ts`**

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
```

### Database Schema Definition

**File: `src/db/schema.ts`**

```typescript
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// Cities table - main water quality data
export const cities = sqliteTable(
  "cities",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    countryCode: text("country_code", { length: 2 }).notNull(),

    // Geolocation
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),

    // Water Safety
    safetyRating: real("safety_rating").notNull(), // 0-10 scale
    officialStatus: text("official_status", {
      enum: ["safe", "caution", "unsafe", "unknown"],
    })
      .notNull()
      .default("unknown"),

    // Water Quality Metrics (Aggregated from user reports or official data)
    phLevel: real("ph_level"),
    chlorineLevel: real("chlorine_level"), // mg/L
    hardness: text("hardness", {
      enum: ["soft", "medium", "hard", "very-hard"],
    }),
    tds: integer("tds"), // Total Dissolved Solids (mg/L)

    // Additional Info
    waterSource: text("water_source"),
    treatmentProcess: text("treatment_process"),
    localAdvice: text("local_advice"),

    // Aggregated ratings (computed from reviews)
    avgTasteRating: real("avg_taste_rating").default(0),
    avgSafetyRating: real("avg_safety_rating").default(0),
    reviewCount: integer("review_count").default(0),

    // Metadata
    dataSource: text("data_source"),
    lastUpdated: integer("last_updated", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    countryIdx: index("country_idx").on(table.country),
    safetyIdx: index("safety_idx").on(table.safetyRating),
    geoIdx: index("geo_idx").on(table.latitude, table.longitude),
  })
);

// User accounts
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),

  // User stats
  reviewCount: integer("review_count").default(0),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// User sessions (for NextAuth)
export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// Accounts (for OAuth providers)
export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
  })
);

// Reviews table
export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Ratings (1-5 stars)
    tasteRating: integer("taste_rating").notNull(),
    safetyRating: integer("safety_rating").notNull(),

    // Optional User-Reported Metrics
    phLevel: real("ph_level"),
    hardness: text("hardness", {
      enum: ["soft", "medium", "hard", "very-hard"],
    }),
    waterSource: text("water_source"),

    // Review content
    reviewText: text("review_text"),
    visitDate: integer("visit_date", { mode: "timestamp" }),

    // Engagement
    helpfulCount: integer("helpful_count").default(0),

    // Moderation
    isPublished: integer("is_published", { mode: "boolean" }).default(true),
    isFlagged: integer("is_flagged", { mode: "boolean" }).default(false),

    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    cityIdx: index("city_idx").on(table.cityId),
    userIdx: index("review_user_idx").on(table.userId),
    createdIdx: index("created_idx").on(table.createdAt),
  })
);

// Helpful votes (to track who marked reviews helpful)
export const helpfulVotes = sqliteTable(
  "helpful_votes",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    reviewUserIdx: index("review_user_idx").on(table.reviewId, table.userId),
  })
);

// User favorite cities
export const favoriteCities = sqliteTable(
  "favorite_cities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    userCityIdx: index("user_city_idx").on(table.userId, table.cityId),
  })
);

// Types for TypeScript
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type User = typeof users.$inferSelect;
```

### Database Client Setup

**File: `src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

### Run Migrations

```bash
# Generate migration files
npx drizzle-kit generate:sqlite

# Push schema to Turso
npx drizzle-kit push:sqlite

# Optional: Open Drizzle Studio to view data
npx drizzle-kit studio
```

---

## 🗺️ MapLibre GL Integration

### MapLibre Setup

**File: `src/components/Map.tsx`**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapProps {
  onCityClick?: (cityId: string) => void;
  cities: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    safetyRating: number;
    officialStatus: "safe" | "caution" | "unsafe" | "unknown";
  }>;
  selectedCityId?: string;
}

export function Map({ cities, onCityClick, selectedCityId }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // Use cached tiles/CDN; fallback to free demo style when key is absent to avoid blocking
      style: process.env.NEXT_PUBLIC_MAPTILER_API_KEY
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`
        : "https://demotiles.maplibre.org/style.json",
      center: [0, 20], // Center of the world
      zoom: 2,
      attributionControl: true,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add city markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers
    cities.forEach((city) => {
      if (!map.current) return;

      const el = document.createElement("div");
      el.className = "city-marker";
      el.style.cursor = "pointer";

      // Color based on safety status
      const color = getStatusColor(city.officialStatus);
      el.innerHTML = `
        <div class="marker-pin" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        "></div>
      `;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      el.addEventListener("click", () => {
        onCityClick?.(city.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([city.longitude, city.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${city.name}</h3>
              <p class="text-sm">Safety: ${city.safetyRating}/10</p>
            </div>
          `)
        )
        .addTo(map.current);

      markersRef.current.set(city.id, marker);
    });
  }, [cities, mapLoaded, onCityClick]);

  // Handle selected city
  useEffect(() => {
    if (!map.current || !selectedCityId) return;

    const city = cities.find((c) => c.id === selectedCityId);
    if (city) {
      map.current.flyTo({
        center: [city.longitude, city.latitude],
        zoom: 10,
        duration: 1500,
      });
    }
  }, [selectedCityId, cities]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: "500px" }}
    />
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "safe":
      return "#10b981"; // green
    case "caution":
      return "#f59e0b"; // orange
    case "unsafe":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
}
```

### Map Styles Configuration

Create a custom style (optional) or use MapTiler/Mapbox styles:

**File: `src/lib/map-config.ts`**

```typescript
export const MAP_CONFIG = {
  style: process.env.NEXT_PUBLIC_MAPTILER_API_KEY
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`
    : "https://demotiles.maplibre.org/style.json", // Fallback demo tiles

  initialView: {
    center: [0, 20] as [number, number],
    zoom: 2,
  },

  markerColors: {
    safe: "#10b981",
    caution: "#f59e0b",
    unsafe: "#ef4444",
    unknown: "#6b7280",
  },
};
```

---

## 🔐 Authentication Setup

### NextAuth Configuration

**File: `src/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
```

**File: `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

---

## 🛣️ API Routes

### Get Cities API

**File: `src/app/api/cities/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { sql, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextParams.searchParams;
  const search = searchParams.get("search");
  const minLat = searchParams.get("minLat");
  const maxLat = searchParams.get("maxLat");
  const minLng = searchParams.get("minLng");
  const maxLng = searchParams.get("maxLng");
  const requestedLimit = parseInt(searchParams.get("limit") || "50");
  const limit = Math.min(Math.max(requestedLimit, 1), 100); // hard cap to protect query cost

  try {
    const conditions = [];

    // Bounding box filter (for map viewport)
    if (minLat && maxLat && minLng && maxLng) {
      conditions.push(
        and(
          gte(cities.latitude, parseFloat(minLat)),
          lte(cities.latitude, parseFloat(maxLat)),
          gte(cities.longitude, parseFloat(minLng)),
          lte(cities.longitude, parseFloat(maxLng))
        )
      );
    }

    // Search filter (debounced client-side; keep LIKE against indexed columns only)
    if (search) {
      conditions.push(
        sql`${cities.name} LIKE ${`%${search}%`} OR ${
          cities.country
        } LIKE ${`%${search}%`}`
      );
    }

    const results = await db
      .select()
      .from(cities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
```

### Get City Details API

**File: `src/app/api/cities/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cities, reviews } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get city data
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, params.id))
      .limit(1);

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Get recent reviews (capped to reduce load)
    const cityReviews = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.cityId, params.id), eq(reviews.isPublished, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    return NextResponse.json({
      city,
      reviews: cityReviews,
    });
  } catch (error) {
    console.error("Error fetching city:", error);
    return NextResponse.json(
      { error: "Failed to fetch city data" },
      { status: 500 }
    );
  }
}
```

### Submit Review API

**File: `src/app/api/reviews/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reviews, cities, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const reviewSchema = z.object({
  cityId: z.string(),
  tasteRating: z.number().min(1).max(5),
  safetyRating: z.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
  visitDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = reviewSchema.parse(body);

    // Create review
    const reviewId = nanoid();
    await db.insert(reviews).values({
      id: reviewId,
      userId: session.user.id,
      cityId: data.cityId,
      tasteRating: data.tasteRating,
      safetyRating: data.safetyRating,
      reviewText: data.reviewText,
      visitDate: data.visitDate ? new Date(data.visitDate) : null,
    });

    // Update city aggregate ratings
    await db
      .update(cities)
      .set({
        reviewCount: sql`${cities.reviewCount} + 1`,
        avgTasteRating: sql`(
          SELECT AVG(taste_rating) 
          FROM ${reviews} 
          WHERE city_id = ${data.cityId} AND is_published = 1
        )`,
        avgSafetyRating: sql`(
          SELECT AVG(safety_rating) 
          FROM ${reviews} 
          WHERE city_id = ${data.cityId} AND is_published = 1
        )`,
      })
      .where(eq(cities.id, data.cityId));

    // Update user review count
    await db
      .update(users)
      .set({
        reviewCount: sql`${users.reviewCount} + 1`,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, reviewId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Frontend Components

### Main Map Page

**File: `src/app/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Map } from "@/components/Map";
import { CityPanel } from "@/components/CityPanel";
import { SearchBar } from "@/components/SearchBar";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const { data: cities, isLoading } = useSWR("/api/cities", fetcher);

  return (
    <div className="relative w-full h-screen">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 z-10 w-96">
        <SearchBar onCitySelect={setSelectedCityId} />
      </div>

      {/* Map */}
      <Map
        cities={cities || []}
        selectedCityId={selectedCityId}
        onCityClick={setSelectedCityId}
      />

      {/* City Details Panel */}
      {selectedCityId && (
        <CityPanel
          cityId={selectedCityId}
          onClose={() => setSelectedCityId(null)}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="text-white">Loading cities...</div>
        </div>
      )}
    </div>
  );
}
```

### City Details Panel Component

**File: `src/components/CityPanel.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { X, Droplet, Star } from "lucide-react";

interface CityPanelProps {
  cityId: string;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CityPanel({ cityId, onClose }: CityPanelProps) {
  const { data, isLoading } = useSWR(`/api/cities/${cityId}`, fetcher);

  if (isLoading) {
    return (
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const { city, reviews } = data;

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{city.name}</h2>
          <p className="text-gray-600">{city.country}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Safety Rating */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Water Safety</h3>
          <SafetyBadge status={city.officialStatus} />
        </div>
        <div className="text-4xl font-bold mb-2">
          {city.safetyRating.toFixed(1)}/10
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <div>
            <span className="block font-medium">Taste</span>
            <StarRating rating={city.avgTasteRating} />
          </div>
          <div>
            <span className="block font-medium">Safety</span>
            <StarRating rating={city.avgSafetyRating} />
          </div>
        </div>
      </div>


      {/* Water Quality Details */}
      <div className="p-6 border-b">
        <h3 className="font-semibold mb-4">Water Quality</h3>
        <div className="space-y-3 text-sm">
          {city.phLevel && (
            <DetailRow label="pH Level" value={city.phLevel.toFixed(1)} />
          )}
          {city.chlorineLevel && (
            <DetailRow label="Chlorine" value={`${city.chlorineLevel} mg/L`} />
          )}
          {city.hardness && (
            <DetailRow label="Hardness" value={city.hardness} />
          )}
          {city.tds && <DetailRow label="TDS" value={`${city.tds} mg/L`} />}
        </div>
      </div>

      {/* Additional Info */}
      {(city.waterSource || city.treatmentProcess || city.localAdvice) && (
        <div className="p-6 border-b">
          <h3 className="font-semibold mb-4">Additional Information</h3>
          {city.waterSource && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700">Source</div>
              <div className="text-sm">{city.waterSource}</div>
            </div>
          )}
          {city.treatmentProcess && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700">Treatment</div>
              <div className="text-sm">{city.treatmentProcess}</div>
            </div>
          )}
          {city.localAdvice && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700">
                Local Advice
              </div>
              <div className="text-sm">{city.localAdvice}</div>
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="p-6">
        <h3 className="font-semibold mb-4">
          Recent Reviews ({city.reviewCount})
        </h3>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyBadge({ status }: { status: string }) {
  const config = {
    safe: { bg: "bg-green-100", text: "text-green-800", label: "Safe" },
    caution: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Use Caution",
    },
    unsafe: { bg: "bg-red-100", text: "text-red-800", label: "Not Safe" },
    unknown: { bg: "bg-gray-100", text: "text-gray-800", label: "Unknown" },
  }[status] || { bg: "bg-gray-100", text: "text-gray-800", label: "Unknown" };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-sm">{review.userName}</div>
        <div className="text-xs text-gray-500">
          {new Date(review.createdAt).toLocaleDateString()}
        </div>
      </div>
      {review.reviewText && (
        <p className="text-sm text-gray-700 mb-2">{review.reviewText}</p>
      )}
      <div className="flex gap-4 text-xs">
        <span>
          Taste: <StarRating rating={review.tasteRating} />
        </span>
        <span>
          Safety: <StarRating rating={review.safetyRating} />
        </span>
      </div>
    </div>
  );
}
```

---

## 🌱 Seed Data

**File: `scripts/seed.ts`**

```typescript
import { db } from "../src/db";
import { cities } from "../src/db/schema";
import { nanoid } from "nanoid";

const seedCities = [
  {
    id: nanoid(),
    name: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    latitude: 41.3851,
    longitude: 2.1734,
    safetyRating: 8.5,
    officialStatus: "safe" as const,
    phLevel: 7.8,
    chlorineLevel: 0.5,
    hardness: "hard" as const,
    tds: 320,
    waterSource: "Ter and Llobregat rivers",
    treatmentProcess: "Conventional treatment with chlorination",
    localAdvice: "Water is safe but may taste different due to hardness",
  },
  {
    id: nanoid(),
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    latitude: 35.6762,
    longitude: 139.6503,
    safetyRating: 9.5,
    officialStatus: "safe" as const,
    phLevel: 7.5,
    chlorineLevel: 0.3,
    hardness: "soft" as const,
    tds: 60,
    waterSource: "Tone, Ara, and Tama rivers",
    treatmentProcess: "Advanced multi-stage filtration",
    localAdvice: "Excellent quality, tastes great",
  },
  // Add more cities...
];

async function seed() {
  console.log("🌱 Seeding database...");

  await db.insert(cities).values(seedCities);

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
```

**Add to `package.json`:**

```json
{
  "scripts": {
    "seed": "tsx scripts/seed.ts"
  }
}
```

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables (Vercel)

Add these in Vercel dashboard:

```
TURSO_DATABASE_URL=your-turso-url
TURSO_AUTH_TOKEN=your-turso-token
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_MAPTILER_API_KEY=your-key-here
```

---

## 📋 Development Checklist

- [ ] Initialize Next.js project
- [ ] Install all dependencies
- [ ] Setup Turso database
- [ ] Configure environment variables
- [ ] Create database schema with Drizzle
- [ ] Run migrations
- [ ] Seed initial city data
- [ ] Implement MapLibre map component
- [ ] Create API routes
- [ ] Build frontend components
- [ ] Setup authentication with NextAuth
- [ ] Test locally
- [ ] Deploy to Vercel
- [ ] Configure production environment variables
- [ ] Test production deployment

---

## 🎯 Next Implementation Steps

1. **Data Collection**: Gather water quality data for major cities
2. **Review System**: Complete the review submission flow
3. **Search**: Implement city search with autocomplete
4. **Mobile Optimization**: Ensure responsive design
5. **Performance**: Add caching and optimize queries
6. **SEO**: Add meta tags and sitemap
7. **Analytics**: Integrate analytics tracking

---

**Last Updated**: December 7, 2025  
**Version**: 1.0  
**Tech Stack**: Next.js 14 + Turso + MapLibre GL
