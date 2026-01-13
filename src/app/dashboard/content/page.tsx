"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Tag, FolderTree } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";

export default function ContentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Content Management</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Manage posts, pages, categories, and tags</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNav />
        {/* Content Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Posts & Pages */}
          <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] hover:border-blue-500 dark:hover:border-blue-600/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-600/10 p-3">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Posts & Pages</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Manage your content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                <Link href="/dashboard/content/posts">View All Posts</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700 backdrop-blur-[3px]">
                <Link href="/dashboard/content/posts/new">Create New Post</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] hover:border-purple-500 dark:hover:border-purple-600/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-600/10 p-3">
                  <FolderTree className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Categories</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Organize content by topic</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600">
                <Link href="/dashboard/content/categories">Manage Categories</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] hover:border-emerald-500 dark:hover:border-emerald-600/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-600/10 p-3">
                  <Tag className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Tags</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Tag and label content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                <Link href="/dashboard/content/tags">Manage Tags</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats (Optional) */}
        <Card className="mt-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Quick Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400">1.</div>
              <div>
                <strong className="text-gray-900 dark:text-white">Create Categories</strong> - Organize your content into logical groups
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-purple-600 dark:text-purple-400">2.</div>
              <div>
                <strong className="text-gray-900 dark:text-white">Add Tags</strong> - Create tags with colors for better visual organization
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-emerald-600 dark:text-emerald-400">3.</div>
              <div>
                <strong className="text-gray-900 dark:text-white">Write Content</strong> - Use the WYSIWYG editor to create rich posts and pages
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
