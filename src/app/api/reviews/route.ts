import { db } from "@/db/client";
import { cities, reviews } from "@/db/schema";
import { mockReviews } from "@/data/mock";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";

const reviewSchema = z.object({
  cityId: z.string(),
  cityName: z.string().optional(), // For new cities not in database
  cityCountry: z.string().optional(), // For new cities not in database
  cityCountryCode: z.string().optional(), // For new cities not in database
  latitude: z.number(),
  longitude: z.number(),
  tasteRating: z.number().min(1).max(5),
  safetyRating: z.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
  visitDate: z.string().optional(),
  phLevel: z.number().optional(),
  hardness: z.enum(["soft", "medium", "hard", "very-hard"]).optional(),
  waterSource: z.string().optional(),
  treatmentProcess: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = reviewSchema.safeParse(body);

  if (!data.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!db) {
    const payload = data.data;
    const newReview = {
      id: nanoid(),
      cityId: payload.cityId,
      userId: "anonymous",
      latitude: payload.latitude,
      longitude: payload.longitude,
      tasteRating: payload.tasteRating,
      safetyRating: payload.safetyRating,
      phLevel: payload.phLevel ?? null,
      hardness: payload.hardness ?? null,
      waterSource: payload.waterSource ?? null,
      treatmentProcess: payload.treatmentProcess ?? null,
      reviewText: payload.reviewText ?? null,
      visitDate: payload.visitDate ? new Date(payload.visitDate) : null,
      helpfulCount: 0,
      isPublished: true,
      isFlagged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReviews[payload.cityId] = [newReview, ...(mockReviews[payload.cityId] ?? [])];
    return NextResponse.json({ review: newReview, persisted: false });
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
        // Create new city
        const newCityId = nanoid();
        await db.insert(cities).values({
          id: newCityId,
          name: payload.cityName,
          country: payload.cityCountry,
          countryCode: payload.cityCountryCode || "XX",
          latitude: payload.latitude,
          longitude: payload.longitude,
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
