import { db } from "@/db/client";
import { cities, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const mergeCitiesSchema = z.object({
  sourceId: z.string(), // City to merge FROM (will be deleted)
  targetId: z.string(), // City to merge INTO (will keep)
});

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const data = mergeCitiesSchema.safeParse(body);

    if (!data.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { sourceId, targetId } = data.data;

    if (sourceId === targetId) {
      return NextResponse.json({ error: "Cannot merge a city into itself" }, { status: 400 });
    }

    // Check both cities exist
    const [sourceCity] = await db.select().from(cities).where(eq(cities.id, sourceId)).limit(1);
    const [targetCity] = await db.select().from(cities).where(eq(cities.id, targetId)).limit(1);

    if (!sourceCity) {
      return NextResponse.json({ error: "Source city not found" }, { status: 404 });
    }
    if (!targetCity) {
      return NextResponse.json({ error: "Target city not found" }, { status: 404 });
    }

    // Count reviews to be moved
    const sourceReviews = await db.select().from(reviews).where(eq(reviews.cityId, sourceId));
    const reviewCount = sourceReviews.length;

    // Move all reviews from source city to target city
    await db
      .update(reviews)
      .set({ cityId: targetId })
      .where(eq(reviews.cityId, sourceId));

    // Delete the source city
    await db.delete(cities).where(eq(cities.id, sourceId));

    // Recalculate target city's average ratings
    const targetReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.cityId, targetId));

    if (targetReviews.length > 0) {
      const avgSafety = targetReviews.reduce((sum, r) => sum + r.safetyRating, 0) / targetReviews.length;
      const avgTaste = targetReviews.reduce((sum, r) => sum + r.tasteRating, 0) / targetReviews.length;

      await db
        .update(cities)
        .set({
          avgSafetyRating: avgSafety,
          avgTasteRating: avgTaste,
          reviewCount: targetReviews.length,
          lastUpdated: new Date(),
        })
        .where(eq(cities.id, targetId));
    }

    return NextResponse.json({
      success: true,
      message: `Merged ${sourceCity.name} into ${targetCity.name}. Moved ${reviewCount} reviews.`,
      movedReviews: reviewCount,
    });
  } catch (error) {
    console.error("Error merging cities:", error);
    return NextResponse.json(
      { error: "Failed to merge cities" },
      { status: 500 }
    );
  }
}
