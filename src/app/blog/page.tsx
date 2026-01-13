"use client";

import useSWR from "swr";
import { Post } from "@/db/schema";
import Link from "next/link";
import { Calendar, Eye, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BlogPage() {
  const { data: posts, error } = useSWR<Post[]>(
    "/api/content/posts?status=published&type=post",
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Failed to load posts</p>
      </div>
    );
  }

  if (!posts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500 dark:border-blue-900 dark:border-t-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4">Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Latest updates, guides, and news about tap water quality
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] border border-white/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
              >
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {post.publishedAt && (
                      <>
                        <Calendar className="h-3 w-3" />
                        <time>
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </time>
                      </>
                    )}
                    <Eye className="h-3 w-3 ml-2" />
                    <span>{post.viewCount || 0}</span>
                  </div>
                  <CardTitle className="text-gray-900 dark:text-gray-100 line-clamp-2">
                    {post.title}
                  </CardTitle>
                  {post.excerpt && (
                    <CardDescription className="text-gray-600 dark:text-gray-400 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href={`/blog/${post.slug}`}>
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Map */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/">Back to Map</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
