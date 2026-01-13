"use client";

import useSWR from "swr";
import { Category } from "@/db/schema";
import { Trash2, Edit2, Save, X, Plus, GripVertical } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/dashboard-nav";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: categories, mutate } = useSWR<Category[]>(
    "/api/content/categories?includeInactive=true",
    fetcher
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Redirect if not admin
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

  const handleCreate = async () => {
    if (!newCategory.name) return;

    setSaving(true);
    try {
      const response = await fetch("/api/content/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) throw new Error("Failed to create category");

      setNewCategory({ name: "", description: "" });
      await mutate();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm(category);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/content/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update category");

      setEditingId(null);
      setEditForm({});
      await mutate();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`/api/content/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      await mutate();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/content/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update category");

      await mutate();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Categories</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Organize your content with categories</p>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNav />
        {/* Create New Category */}
        <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Create New Category</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Add a new category to organize your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 backdrop-blur-[3px]"
              />
              <Input
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 backdrop-blur-[3px]"
              />
              <Button
                onClick={handleCreate}
                disabled={saving || !newCategory.name}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">All Categories</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {categories?.length || 0} categories total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-4 rounded-lg border border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-4 backdrop-blur-[3px]"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-600" />

                  {editingId === category.id ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white backdrop-blur-[3px]"
                        />
                        <Input
                          value={editForm.description || ""}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Description"
                          className="border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 backdrop-blur-[3px]"
                        />
                      </div>
                      <Button
                        onClick={() => handleSave(category.id)}
                        disabled={saving}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{category.name}</h3>
                          <Badge
                            variant={category.isActive ? "success" : "secondary"}
                            className={category.isActive ? "bg-emerald-600 text-white" : "bg-gray-400 dark:bg-gray-700 text-white dark:text-gray-300"}
                          >
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          Slug: {category.slug}
                        </p>
                      </div>
                      <Button
                        onClick={() => toggleActive(category)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                      >
                        {category.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        onClick={() => handleEdit(category)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(category.id)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {!categories || categories.length === 0 && (
                <div className="py-12 text-center text-gray-500 dark:text-gray-500">
                  No categories yet. Create your first one above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
