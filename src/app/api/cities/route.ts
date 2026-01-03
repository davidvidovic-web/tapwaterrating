import { db } from "@/db/client";
import { cities } from "@/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const minLat = searchParams.get("minLat");
  const maxLat = searchParams.get("maxLat");
  const minLng = searchParams.get("minLng");
  const maxLng = searchParams.get("maxLng");
  const requestedLimit = parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`);
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const conditions: Array<ReturnType<typeof and> | ReturnType<typeof sql>> = [];

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
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, country, latitude, longitude } = body;

    if (!name || !country || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, country, latitude, longitude" },
        { status: 400 }
      );
    }

    // Check if city already exists
    const existing = await db
      .select()
      .from(cities)
      .where(
        sql`${cities.name} = ${name} AND ${cities.country} = ${country}`
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "City already exists", city: existing[0] },
        { status: 409 }
      );
    }

    // Create new city
    const result = await db
      .insert(cities)
      .values({
        id: randomUUID(),
        name,
        country,
        countryCode: "", // Will be populated if needed
        latitude,
        longitude,
        safetyRating: 0,
        officialStatus: "unknown",
        avgTasteRating: 0,
        avgSafetyRating: 0,
        reviewCount: 0,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating city:", error);
    return NextResponse.json({ error: "Failed to create city" }, { status: 500 });
  }
}
