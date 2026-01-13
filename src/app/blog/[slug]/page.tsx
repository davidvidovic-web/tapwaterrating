import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPage from "./client-page";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    if (!db) {
      return {
        title: "Post Not Found",
      };
    }

    const post = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1);

    if (post.length === 0) {
      return {
        title: "Post Not Found",
      };
    }

    const postData = post[0];

    return {
      title: postData.metaTitle || postData.title,
      description: postData.metaDescription || postData.excerpt || undefined,
      keywords: postData.metaKeywords?.split(",").map(k => k.trim()),
      openGraph: {
        title: postData.metaTitle || postData.title,
        description: postData.metaDescription || postData.excerpt || undefined,
        type: "article",
        publishedTime: postData.publishedAt ? new Date(postData.publishedAt).toISOString() : undefined,
        images: postData.featuredImage ? [postData.featuredImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: postData.metaTitle || postData.title,
        description: postData.metaDescription || postData.excerpt || undefined,
        images: postData.featuredImage ? [postData.featuredImage] : undefined,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Post Not Found",
    };
  }
}

export default ClientPage;

