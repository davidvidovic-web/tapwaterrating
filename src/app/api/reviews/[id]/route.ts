import { db } from "@/db/client";
import { cities, reviews } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateReviewSchema = z.object({
  tasteRating: z.number().min(1).max(5).optional(),
  safetyRating: z.number().min(1).max(5).optional(),
  reviewText: z.string().max(1000).optional(),
  phLevel: z.number().nullable().optional(),
  hardness: z.enum(["soft", "medium", "hard", "very-hard"]).nullable().optional(),
  waterSource: z.string().nullable().optional(),
  treatmentProcess: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  streetAddress: z.string().nullable().optional(),
  locationName: z.string().nullable().optional(),
  cityId: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const data = updateReviewSchema.safeParse(body);

    if (!data.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Get the review first to know which city to update
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const oldCityId = review.cityId;
    const newCityId = data.data.cityId || oldCityId;

    // Update the review
    await db
      .update(reviews)
      .set({
        ...data.data,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id));

    // Recalculate aggregates for both old and new cities if city changed or ratings changed
    const needsAggregateUpdate = 
      data.data.tasteRating !== undefined || 
      data.data.safetyRating !== undefined || 
      data.data.isPublished !== undefined ||
      (data.data.cityId && data.data.cityId !== oldCityId);

    if (needsAggregateUpdate) {
      // Update old city aggregates if city changed
      if (data.data.cityId && data.data.cityId !== oldCityId) {
        const oldCityAggregates = await db
          .select({
            avgTaste: sql<number>`avg(${reviews.tasteRating})`,
            avgSafety: sql<number>`avg(${reviews.safetyRating})`,
            count: sql<number>`count(*)`,
          })
          .from(reviews)
          .where(and(eq(reviews.cityId, oldCityId), eq(reviews.isPublished, true)));

        const { avgTaste: oldAvgTaste, avgSafety: oldAvgSafety, count: oldCount } = oldCityAggregates[0];

        await db
          .update(cities)
          .set({
            avgTasteRating: oldAvgTaste || 0,
            avgSafetyRating: oldAvgSafety || 0,
            reviewCount: oldCount || 0,
            lastUpdated: new Date(),
          })
          .where(eq(cities.id, oldCityId));
      }

      // Update new/current city aggregates
      const aggregates = await db
        .select({
          avgTaste: sql<number>`avg(${reviews.tasteRating})`,
          avgSafety: sql<number>`avg(${reviews.safetyRating})`,
          count: sql<number>`count(*)`,
        })
        .from(reviews)
        .where(and(eq(reviews.cityId, newCityId), eq(reviews.isPublished, true)));

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
        .where(eq(cities.id, newCityId));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Review updated successfully" 
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    // Get the review first to know which city to update
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const cityId = review.cityId;

    // Delete the review
    await db.delete(reviews).where(eq(reviews.id, id));

    // Recalculate city aggregates
    const aggregates = await db
      .select({
        avgTaste: sql<number>`avg(${reviews.tasteRating})`,
        avgSafety: sql<number>`avg(${reviews.safetyRating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.cityId, cityId), eq(reviews.isPublished, true)));

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
      .where(eq(cities.id, cityId));

    return NextResponse.json({ 
      success: true, 
      message: "Review deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
