"use client";

import useSWR from "swr";
import { Post } from "@/db/schema";
import Link from "next/link";
import { FileText, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ResourcesPage() {
  const { data: content, error } = useSWR<Post[]>(
    "/api/content/posts?status=published",
    fetcher
  );
  const [search, setSearch] = useState("");

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Failed to load resources</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500 dark:border-blue-900 dark:border-t-blue-400"></div>
      </div>
    );
  }

  const filteredContent = content.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4">
            Resources
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Everything you need to know about tap water quality
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] border-white/50 dark:border-gray-700/50 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Articles List */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {search ? "No articles found matching your search." : "No articles yet. Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item) => (
              <Link
                key={item.id}
                href={item.type === 'post' ? `/blog/${item.slug}` : `/${item.slug}`}
                className="block bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] rounded-xl p-6 border border-white/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950 dark:to-cyan-950 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h2>
                    {item.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back to Map */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline" className="border-gray-300 hover:border-blue-600 hover:text-blue-600">
            <Link href="/">Back to Map</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
