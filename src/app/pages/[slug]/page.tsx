"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { Post } from "@/db/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PageView() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: page, error } = useSWR<Post>(
    slug ? `/api/content/posts/by-slug/${slug}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Link>
        </Button>

        {/* Page Header */}
        <article className="space-y-6">
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {page.title}
            </h1>

            {page.excerpt && (
              <p className="text-xl text-gray-400 leading-relaxed">
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
            className="prose prose-lg prose-invert max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-4
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-ul:my-4 prose-ol:my-4
              prose-li:text-gray-300 prose-li:my-1
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500
              prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400
              prose-code:text-blue-400 prose-code:bg-gray-900 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
              prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  );
}
