import { MetadataRoute } from "next";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
 
export const dynamic = "force-dynamic";
export const revalidate = 3600;


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tapwaterrating.com";

  // Fetch all published posts and pages
  let publishedPosts: any[] = [];
  
  try {
    if (db) {
      publishedPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"));
    } else {
        console.error("Database client is not initialized");
    }

  } catch (error) {
    console.error("Error fetching posts for sitemap:", error);
  }

  // Generate sitemap entries for posts and pages
  const postEntries: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${baseUrl}/${post.type === "post" ? "blog/" : ""}${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: post.type === "post" ? "weekly" : "monthly",
    priority: post.type === "page" ? 0.8 : 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
