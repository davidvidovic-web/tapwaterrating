"use client";

import { useParams, notFound } from "next/navigation";
import useSWR from "swr";
import { Post } from "@/db/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (res.status === 404) {
    throw new Error("Not Found");
  }
  return res.json();
});

export default function PageView() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: page, error } = useSWR<Post>(
    slug ? `/api/content/posts/by-slug/${slug}` : null,
    fetcher
  );

  if (error) {
    notFound();
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500 dark:border-blue-900 dark:border-t-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-white/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50"
        >
          <Link href="/resources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Link>
        </Button>

        {/* Page Header */}
        <article className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] rounded-2xl p-8 border border-white/50 dark:border-gray-700/50 space-y-6">
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight">
              {page.title}
            </h1>

            {page.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {page.excerpt}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {page.featuredImage && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={page.featuredImage}
                alt={page.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Page Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-4
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
              prose-ul:my-4 prose-ol:my-4
              prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-1
              prose-blockquote:border-l-4 prose-blockquote:border-blue-400 dark:prose-blockquote:border-blue-600
              prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
              prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-950/50 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
              prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  );
}
