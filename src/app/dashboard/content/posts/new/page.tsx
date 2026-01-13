"use client";

import useSWR from "swr";
import { Category, Tag } from "@/db/schema";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: categories } = useSWR<Category[]>("/api/content/categories", fetcher);
  const { data: tags } = useSWR<Tag[]>("/api/content/tags", fetcher);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [contentJson, setContentJson] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [type, setType] = useState<"post" | "page">("post");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [improvingContent, setImprovingContent] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/admin/login");
    return null;
  }

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate slug if it's empty or matches the previous title's slug
    const previousSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug || slug === previousSlug) {
      const newSlug = value
        .toLowerCase()
        .replace(/\s+/g, "-")           // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, "")     // Remove non-alphanumeric except hyphens
        .replace(/-+/g, "-")            // Replace multiple hyphens with single
        .replace(/(^-|-$)/g, "");       // Remove leading/trailing hyphens
      setSlug(newSlug);
    }
  };

  const handleEditorChange = (html: string, json: string) => {
    setContent(html);
    setContentJson(json);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title || !content) {
      toast({
        variant: "error",
        title: "Missing fields",
        description: "Title and content are required",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/content/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          contentJson,
          featuredImage: featuredImage || undefined,
          type,
          status,
          categoryId: categoryId || undefined,
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          metaKeywords: metaKeywords || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      const post = await response.json();
      router.push(`/dashboard/content/posts/${post.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to create post",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateMeta = async () => {
    if (!title && !content) {
      toast({
        variant: "warning",
        title: "Missing content",
        description: "Please add a title or content first",
      });
      return;
    }

    setGeneratingMeta(true);

    try {
      const response = await fetch("/api/ai/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt }),
      });

      if (!response.ok) throw new Error("Failed to generate metadata");

      const data = await response.json();
      setMetaTitle(data.metaTitle || "");
      setMetaDescription(data.metaDescription || "");
      setMetaKeywords(data.metaKeywords || "");
      if (!excerpt && data.suggestedExcerpt) {
        setExcerpt(data.suggestedExcerpt);
      }
      toast({
        variant: "success",
        title: "Metadata generated",
        description: "AI has created SEO metadata for your post",
      });
    } catch (error) {
      console.error("Error generating metadata:", error);
      toast({
        variant: "error",
        title: "AI Error",
        description: "Failed to generate metadata. Please check your API key.",
      });
    } finally {
      setGeneratingMeta(false);
    }
  };

  const handleImproveContent = async (action: string) => {
    if (!content) {
      toast({
        variant: "warning",
        title: "Missing content",
        description: "Please add content first",
      });
      return;
    }

    setImprovingContent(true);

    try {
      const response = await fetch("/api/ai/improve-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, action, context: metaKeywords }),
      });

      if (!response.ok) throw new Error("Failed to process content");

      const data = await response.json();
      if (action === "generate-excerpt") {
        setExcerpt(data.content);
        toast({
          variant: "success",
          title: "Excerpt generated",
          description: "AI has created your excerpt",
        });
      } else {
        setContent(data.content);
        setEditorKey(prev => prev + 1); // Force editor to re-render with new content
        toast({
          variant: "success",
          title: "Content updated",
          description: "AI has processed your content",
        });
      }
    } catch (error) {
      console.error("Error processing content:", error);
      toast({
        variant: "error",
        title: "AI Error",
        description: "Failed to process content. Please check your API key.",
      });
    } finally {
      setImprovingContent(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!title) {
      toast({
        variant: "warning",
        title: "Missing title",
        description: "Please add a title first",
      });
      return;
    }

    const prompt = window.prompt(
      "What would you like to write about?",
      `Write a ${type === "post" ? "blog post" : "page"} about: ${title}`
    );

    if (!prompt) return;

    setGeneratingContent(true);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context: metaKeywords }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const data = await response.json();
      setContent(data.content);
      setEditorKey(prev => prev + 1); // Force editor to re-render with new content
      toast({
        variant: "success",
        title: "Content generated",
        description: "AI has created your content",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        variant: "error",
        title: "AI Error",
        description: "Failed to generate content. Please check your API key.",
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">New {type === "post" ? "Post" : "Page"}</h1>
              <p className="mt-2 text-gray-400">Create a new {type}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleSave("draft")}
              disabled={saving}
              variant="outline"
              className="border-gray-700 bg-gray-800/50 text-gray-200 hover:bg-gray-700"
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type Selector */}
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    onClick={() => setType("post")}
                    size="sm"
                    className={type === "post" ? "bg-blue-600 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700"}
                  >
                    Post
                  </Button>
                  <Button
                    onClick={() => setType("page")}
                    size="sm"
                    className={type === "page" ? "bg-blue-600 text-white" : "border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700"}
                  >
                    Page
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Title & Slug */}
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-200">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter title..."
                    className="mt-1 border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-gray-200">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated-slug"
                    className="mt-1 border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt" className="text-gray-200">Excerpt</Label>
                  <Button
                    onClick={() => handleImproveContent("generate-excerpt")}
                    disabled={improvingContent || !content}
                    size="sm"
                    variant="outline"
                    className="border-purple-700 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary..."
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Content</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateContent}
                      disabled={generatingContent || !title}
                      size="sm"
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatingContent ? "Generating..." : "AI Generate"}
                    </Button>
                    <Button
                      onClick={() => handleImproveContent("improve")}
                      disabled={improvingContent || !content}
                      size="sm"
                      variant="outline"
                      className="border-purple-700 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Improve
                    </Button>
                    <Button
                      onClick={() => handleImproveContent("expand")}
                      disabled={improvingContent || !content}
                      size="sm"
                      variant="outline"
                      className="border-purple-700 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Expand
                    </Button>
                    <Button
                      onClick={() => handleImproveContent("seo-optimize")}
                      disabled={improvingContent || !content}
                      size="sm"
                      variant="outline"
                      className="border-purple-700 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      SEO
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TiptapEditor
                  key={editorKey}
                  content={content}
                  onChange={handleEditorChange}
                />
              </CardContent>
            </Card>

            {/* SEO Meta */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">SEO Meta</CardTitle>
                    <CardDescription className="text-gray-400">
                      Optional meta information for search engines
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateMeta}
                    disabled={generatingMeta || !title}
                    size="sm"
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generatingMeta ? "Generating..." : "AI Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle" className="text-gray-200">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO title..."
                    className="mt-1 border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription" className="text-gray-200">Meta Description</Label>
                  <textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description..."
                    rows={2}
                    className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="metaKeywords" className="text-gray-200">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    className="mt-1 border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="Image URL..."
                  className="border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
                />
                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt="Preview"
                    className="w-full rounded-lg border border-gray-700"
                  />
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">No category</option>
                  {categories?.filter((c) => c.isActive).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags?.filter((t) => t.isActive).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "bg-blue-600 text-white"
                          : "border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {tag.color && (
                        <span
                          className="mr-1 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                    </button>
                  ))}
                </div>
                {(!tags || tags.length === 0) && (
                  <p className="text-sm text-gray-500">No tags available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
