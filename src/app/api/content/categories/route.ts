import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { auth } from "@/auth";
import slugify from "slugify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    let query = db
      .select()
      .from(categories)
      .orderBy(asc(categories.order), asc(categories.name));

    if (parentId) {
      query = query.where(eq(categories.parentId, parentId)) as any;
    } else if (parentId === null) {
      query = query.where(isNull(categories.parentId)) as any;
    }

    if (!includeInactive) {
      query = query.where(eq(categories.isActive, true)) as any;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, description, parentId, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const newCategory = await db.insert(categories).values({
      id: nanoid(),
      name,
      slug,
      description: description || null,
      parentId: parentId || null,
      order: order || 0,
      isActive: true,
    }).returning();

    return NextResponse.json(newCategory[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
