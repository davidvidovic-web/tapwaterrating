import { db } from "@/db/client";
import { cities } from "@/db/schema";
import { mockCities } from "@/data/mock";
import { and, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

  const applyFilters = (items: typeof mockCities) => {
    return items
      .filter((city) => {
        if (minLat && maxLat && minLng && maxLng) {
          const withinLat =
            city.latitude >= parseFloat(minLat) &&
            city.latitude <= parseFloat(maxLat);
          const withinLng =
            city.longitude >= parseFloat(minLng) &&
            city.longitude <= parseFloat(maxLng);
          if (!(withinLat && withinLng)) return false;
        }
        if (search) {
          const needle = search.toLowerCase();
          const haystack = `${city.name} ${city.country}`.toLowerCase();
          return haystack.includes(needle);
        }
        return true;
      })
      .slice(0, limit);
  };

  if (!db) {
    return NextResponse.json(applyFilters(mockCities));
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
