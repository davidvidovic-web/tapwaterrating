import { db } from "@/db/client";
import { cities, reviews } from "@/db/schema";
import { mockCities, mockReviews } from "@/data/mock";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  if (!db) {
    const city = mockCities.find((c) => c.id === id);
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }
    return NextResponse.json({ city, reviews: mockReviews[id] ?? [] });
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
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    return NextResponse.json({ city, reviews: cityReviews });
  } catch (error) {
    console.error("Error fetching city:", error);
    return NextResponse.json({ error: "Failed to fetch city" }, { status: 500 });
  }
}
