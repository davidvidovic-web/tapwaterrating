import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { posts, postTags } from "@/db/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { auth } from "@/auth";
import slugify from "slugify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    let query = db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    const conditions = [];
    if (type) conditions.push(eq(posts.type, type as any));
    if (status) conditions.push(eq(posts.status, status as any));
    if (search) {
      conditions.push(
        or(
          like(posts.title, `%${search}%`),
          like(posts.content, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      contentJson,
      excerpt,
      type,
      status,
      categoryId,
      tagIds,
      featuredImage,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const slug = slugify(title, { lower: true, strict: true });
    const postId = nanoid();

    const newPost = await db.insert(posts).values({
      id: postId,
      title,
      slug,
      content,
      contentJson: contentJson || null,
      excerpt: excerpt || null,
      type: type || "post",
      status: status || "draft",
      authorId: session.user.id,
      categoryId: categoryId || null,
      featuredImage: featuredImage || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      publishedAt: status === "published" ? new Date() : null,
    }).returning();

    // Add tags
    if (tagIds && tagIds.length > 0) {
      await db.insert(postTags).values(
        tagIds.map((tagId: string) => ({
          postId,
          tagId,
        }))
      );
    }

    return NextResponse.json(newPost[0]);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
