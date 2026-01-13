import { db } from "@/db/client";
import { cities, reviews } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCitySchema = z.object({
  name: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  safetyRating: z.number().optional(),
  officialStatus: z.enum(["safe", "caution", "unsafe", "unknown"]).optional(),
});

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const [city] = await db.select().from(cities).where(eq(cities.id, id)).limit(1);

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const cityReviews = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.cityId, id), eq(reviews.isPublished, true)))
      .orderBy(desc(reviews.createdAt));

    return NextResponse.json({ city, reviews: cityReviews });
  } catch (error) {
    console.error("Error fetching city:", error);
    return NextResponse.json({ error: "Failed to fetch city" }, { status: 500 });
  }
}

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
    const data = updateCitySchema.safeParse(body);

    if (!data.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Update the city with provided fields
    await db
      .update(cities)
      .set({
        ...data.data,
        lastUpdated: new Date(),
      })
      .where(eq(cities.id, id));

    return NextResponse.json({ 
      success: true, 
      message: "City updated successfully" 
    });
  } catch (error) {
    console.error("Error updating city:", error);
    return NextResponse.json(
      { error: "Failed to update city" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    // Check if city exists
    const [city] = await db.select().from(cities).where(eq(cities.id, id)).limit(1);

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Delete the city (reviews will need to be handled separately or cascade)
    await db.delete(cities).where(eq(cities.id, id));

    return NextResponse.json({ 
      success: true, 
      message: "City deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return NextResponse.json(
      { error: "Failed to delete city" },
      { status: 500 }
    );
  }
}
