import { db } from "@/db/client";
import { cities, reviews } from "@/db/schema";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql, desc } from "drizzle-orm";

const reviewSchema = z.object({
  cityId: z.string(),
  cityName: z.string().optional(), // For new cities not in database
  cityCountry: z.string().optional(), // For new cities not in database
  cityCountryCode: z.string().optional(), // For new cities not in database
  latitude: z.number(),
  longitude: z.number(),
  streetAddress: z.string().optional(),
  locationName: z.string().optional(),
  tasteRating: z.number().min(1).max(5),
  safetyRating: z.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
  visitDate: z.string().optional(),
  phLevel: z.number().optional(),
  hardness: z.enum(["soft", "medium", "hard", "very-hard"]).optional(),
  waterSource: z.string().optional(),
  treatmentProcess: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "1000");
  const showAll = searchParams.get("showAll") === "true";

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const query = db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt));
    
    // Only filter by isPublished if showAll is not set
    const allReviews = showAll
      ? await query.limit(Math.min(limit, 1000))
      : await query.where(eq(reviews.isPublished, true)).limit(Math.min(limit, 1000));

    return NextResponse.json(allReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = reviewSchema.safeParse(body);

  if (!data.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const payload = data.data;
    const reviewId = nanoid();
    let actualCityId = payload.cityId;

    // If cityId is -1, this is a new city not in the database
    if (payload.cityId === "-1" && payload.cityName && payload.cityCountry) {
      // Check if city already exists
      const existingCity = await db
        .select()
        .from(cities)
        .where(
          and(
            eq(cities.name, payload.cityName),
            eq(cities.country, payload.cityCountry)
          )
        )
        .limit(1);

      if (existingCity.length > 0) {
        actualCityId = existingCity[0].id;
      } else {
        // Fetch proper city center coordinates from Nominatim
        let cityLat = Math.round(payload.latitude * 100) / 100;
        let cityLon = Math.round(payload.longitude * 100) / 100;
        
        try {
          // Use Nominatim Search API to get canonical city center
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(payload.cityName)}&country=${encodeURIComponent(payload.cityCountry)}&format=json&limit=1&accept-language=en`,
            {
              headers: {
                'User-Agent': 'TapWaterRating/1.0',
                'Accept-Language': 'en'
              }
            }
          );

          if (nominatimResponse.ok) {
            const results = await nominatimResponse.json();
            if (results && results.length > 0) {
              // Use the canonical city center from Nominatim
              cityLat = parseFloat(results[0].lat);
              cityLon = parseFloat(results[0].lon);
            }
          }
        } catch (error) {
          console.error('Failed to fetch city center from Nominatim:', error);
          // Fall back to rounded coordinates if geocoding fails
        }
        
        const newCityId = nanoid();
        await db.insert(cities).values({
          id: newCityId,
          name: payload.cityName,
          country: payload.cityCountry,
          countryCode: payload.cityCountryCode || "XX",
          latitude: cityLat,
          longitude: cityLon,
          safetyRating: 0,
          officialStatus: "unknown",
          avgSafetyRating: 0,
          avgTasteRating: 0,
          reviewCount: 0,
          phLevel: null,
          hardness: null,
          chlorineLevel: null,
          tds: null,
          waterSource: null,
          treatmentProcess: null,
          localAdvice: null,
          dataSource: "user_submitted",
          lastUpdated: new Date(),
        });
        actualCityId = newCityId;
      }
    }

    await db.insert(reviews).values({
      id: reviewId,
      cityId: actualCityId,
      userId: "anonymous",
      latitude: payload.latitude,
      longitude: payload.longitude,
      streetAddress: payload.streetAddress ?? null,
      locationName: payload.locationName ?? null,
      tasteRating: payload.tasteRating,
      safetyRating: payload.safetyRating,
      phLevel: payload.phLevel ?? null,
      hardness: payload.hardness,
      waterSource: payload.waterSource,
      treatmentProcess: payload.treatmentProcess,
      reviewText: payload.reviewText ?? null,
      visitDate: payload.visitDate ? new Date(payload.visitDate) : null,
      helpfulCount: 0,
      isPublished: true,
      isFlagged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Recalculate city aggregates
    const aggregates = await db
      .select({
        avgTaste: sql<number>`avg(${reviews.tasteRating})`,
        avgSafety: sql<number>`avg(${reviews.safetyRating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.cityId, actualCityId), eq(reviews.isPublished, true)));

    const { avgTaste, avgSafety, count } = aggregates[0];

    // Update city stats
    await db
      .update(cities)
      .set({
        avgTasteRating: avgTaste || 0,
        avgSafetyRating: avgSafety || 0,
        reviewCount: count || 0,
        lastUpdated: new Date(),
      })
      .where(eq(cities.id, actualCityId));

    return NextResponse.json({ reviewId, cityId: actualCityId, persisted: true });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
