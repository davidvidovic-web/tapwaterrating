"use client";

import useSWR from "swr";
import { Tag } from "@/db/schema";
import { Trash2, Edit2, Save, X, Plus } from "lucide-react";
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

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export default function TagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: tags, mutate } = useSWR<Tag[]>(
    "/api/content/tags?includeInactive=true",
    fetcher
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tag>>({});
  const [newTag, setNewTag] = useState({ name: "", description: "", color: "#3b82f6" });
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
    if (!newTag.name) return;

    setSaving(true);
    try {
      const response = await fetch("/api/content/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });

      if (!response.ok) throw new Error("Failed to create tag");

      setNewTag({ name: "", description: "", color: "#3b82f6" });
      await mutate();
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditForm(tag);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/content/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update tag");

      setEditingId(null);
      setEditForm({});
      await mutate();
    } catch (error) {
      console.error("Error updating tag:", error);
      alert("Failed to update tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const response = await fetch(`/api/content/tags/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete tag");

      await mutate();
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag");
    }
  };

  const toggleActive = async (tag: Tag) => {
    try {
      const response = await fetch(`/api/content/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tag.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update tag");

      await mutate();
    } catch (error) {
      console.error("Error updating tag:", error);
      alert("Failed to update tag");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tags</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage tags for your content</p>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNav />
        {/* Create New Tag */}
        <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Create New Tag</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Add a new tag with a custom color</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Tag name"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  className="border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 backdrop-blur-[3px]"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  className="border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 backdrop-blur-[3px]"
                />
              </div>
              
              {/* Color Picker */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTag({ ...newTag, color })}
                      className="h-8 w-8 rounded-md border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: newTag.color === color ? "#fff" : "transparent",
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="h-8 w-16 cursor-pointer rounded-md border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={saving || !newTag.name}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tags Grid */}
        <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">All Tags</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {tags?.length || 0} tags total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tags?.map((tag) => (
                <div
                  key={tag.id}
                  className="rounded-lg border border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-4 backdrop-blur-[3px]"
                >
                  {editingId === tag.id ? (
                    <div className="space-y-3">
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
                      
                      {/* Color Picker for Edit */}
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.slice(0, 10).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, color })}
                            className="h-6 w-6 rounded border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: color,
                              borderColor: editForm.color === color ? "#fff" : "transparent",
                            }}
                          />
                        ))}
                        <input
                          type="color"
                          value={editForm.color || "#3b82f6"}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="h-6 w-12 cursor-pointer rounded border-2 border-gray-300 dark:border-gray-600"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(tag.id)}
                          disabled={saving}
                          size="sm"
                          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
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
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color || "#3b82f6" }}
                        />
                        <h3 className="flex-1 font-medium text-gray-900 dark:text-white">{tag.name}</h3>
                        <Badge
                          variant={tag.isActive ? "success" : "secondary"}
                          className={tag.isActive ? "bg-emerald-600 text-white text-xs" : "bg-gray-400 dark:bg-gray-700 text-white dark:text-gray-300 text-xs"}
                        >
                          {tag.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      {tag.description && (
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{tag.description}</p>
                      )}
                      
                      <p className="mb-3 text-xs text-gray-500 dark:text-gray-500">Slug: {tag.slug}</p>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => toggleActive(tag)}
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                        >
                          {tag.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          onClick={() => handleEdit(tag)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(tag.id)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/60 dark:hover:bg-gray-700 backdrop-blur-[3px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {!tags || tags.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-500">
                  No tags yet. Create your first one above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
