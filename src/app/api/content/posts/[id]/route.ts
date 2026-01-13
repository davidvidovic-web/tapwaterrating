import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { posts, postTags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import slugify from "slugify";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Get tags
    const tags = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, id));

    return NextResponse.json({
      ...post[0],
      tagIds: tags.map(t => t.tagId),
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const updates: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = title;
      updates.slug = slugify(title, { lower: true, strict: true });
    }
    if (content !== undefined) updates.content = content;
    if (contentJson !== undefined) updates.contentJson = contentJson;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (type !== undefined) updates.type = type;
    if (status !== undefined) {
      updates.status = status;
      if (status === "published" && !updates.publishedAt) {
        updates.publishedAt = new Date();
      }
    }
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (metaTitle !== undefined) updates.metaTitle = metaTitle;
    if (metaDescription !== undefined) updates.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updates.metaKeywords = metaKeywords;

    const updated = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.delete(postTags).where(eq(postTags.postId, id));

      // Add new tags
      if (tagIds.length > 0) {
        await db.insert(postTags).values(
          tagIds.map((tagId: string) => ({
            postId: id,
            tagId,
          }))
        );
      }
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    await db.delete(posts).where(eq(posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
