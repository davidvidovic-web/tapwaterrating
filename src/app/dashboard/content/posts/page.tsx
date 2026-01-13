"use client";

import useSWR from "swr";
import { Post } from "@/db/schema";
import { Eye, EyeOff, Trash2, Edit2, Plus, FileText, File } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/dashboard-nav";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: posts, mutate, error } = useSWR<Post[]>("/api/content/posts", fetcher);
  const [filter, setFilter] = useState<"all" | "post" | "page">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Redirect if not authenticated
  if (status === "loading" || !posts) {
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

  // Handle error or invalid data
  if (error || !Array.isArray(posts)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Failed to load posts</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/content/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete post");

      await mutate();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to delete post",
      });
    }
  };

  const toggleStatus = async (post: Post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    
    try {
      const response = await fetch(`/api/content/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update post");

      await mutate();
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to update post",
      });
    }
  };

  const filteredPosts = posts?.filter((post) => {
    if (filter !== "all" && post.type !== filter) return false;
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (search && !post.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-600 text-white">Published</Badge>;
      case "draft":
        return <Badge className="bg-amber-600 text-white">Draft</Badge>;
      case "archived":
        return <Badge className="bg-gray-600 text-white">Archived</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Posts & Pages</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your content</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
              <Link href="/dashboard/content/posts/new">
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Link>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNav />
        {/* Filters */}
        <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 backdrop-blur-[3px]"
              />

              {/* Type Filter */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter("all")}
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  className={filter === "all" ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 backdrop-blur-[3px]"}
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilter("post")}
                  size="sm"
                  variant={filter === "post" ? "default" : "outline"}
                  className={filter === "post" ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 backdrop-blur-[3px]"}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Posts
                </Button>
                <Button
                  onClick={() => setFilter("page")}
                  size="sm"
                  variant={filter === "page" ? "default" : "outline"}
                  className={filter === "page" ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 backdrop-blur-[3px]"}
                >
                  <File className="h-4 w-4 mr-1" />
                  Pages
                </Button>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {["all", "draft", "published", "archived"].map((s) => (
                  <Button
                    key={s}
                    onClick={() => setStatusFilter(s as "all" | "draft" | "published" | "archived")}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    className={statusFilter === s ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 backdrop-blur-[3px]"}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {filteredPosts.length || 0} {filter === "all" ? "items" : filter === "post" ? "posts" : "pages"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 rounded-lg border border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-4 hover:bg-white/80 dark:hover:bg-gray-700 transition-colors backdrop-blur-[3px]"
                >
                  {post.type === "post" ? (
                    <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  ) : (
                    <File className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{post.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    {post.excerpt && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{post.excerpt}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>/{post.slug}</span>
                      {post.publishedAt && (
                        <span>
                          Published: {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      <span>{post.viewCount || 0} views</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleStatus(post)}
                      size="sm"
                      variant="ghost"
                      title={post.status === "published" ? "Unpublish" : "Publish"}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                    >
                      {post.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                    >
                      <Link href={`/dashboard/content/posts/${post.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      onClick={() => handleDelete(post.id)}
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {!filteredPosts || filteredPosts.length === 0 && (
                <div className="py-12 text-center text-gray-500 dark:text-gray-500">
                  {search || filter !== "all" || statusFilter !== "all" ? (
                    <p>No posts match your filters.</p>
                  ) : (
                    <p>No posts yet. Create your first one!</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
