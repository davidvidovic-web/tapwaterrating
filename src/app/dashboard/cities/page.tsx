"use client";

import useSWR from "swr";
import { City } from "@/db/schema";
import { Trash2, Edit2, Save, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type EditingCity = {
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  safetyRating: number;
  officialStatus: string;
};

export default function CitiesManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: cities, mutate } = useSWR<City[]>("/api/cities?limit=1000", fetcher);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingCity | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCityForm, setNewCityForm] = useState<EditingCity>({
    name: "",
    country: "",
    countryCode: "",
    latitude: 0,
    longitude: 0,
    safetyRating: 5,
    officialStatus: "unknown",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !session.user || session.user.role !== "admin") {
      router.push("/admin/login");
      return;
    }
  }, [session, status, router]);

  const filteredCities = cities?.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = async (cityId: string) => {
    if (!confirm("Are you sure you want to delete this city? This will affect all reviews associated with it.")) {
      return;
    }

    setDeletingId(cityId);
    try {
      const response = await fetch(`/api/cities/${cityId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete city");
      }

      await mutate();
    } catch (error) {
      console.error("Error deleting city:", error);
      alert("Failed to delete city");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (city: City) => {
    setEditingId(city.id);
    setEditForm({
      name: city.name,
      country: city.country,
      countryCode: city.countryCode,
      latitude: city.latitude,
      longitude: city.longitude,
      safetyRating: city.safetyRating,
      officialStatus: city.officialStatus,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async (cityId: string) => {
    if (!editForm) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cities/${cityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update city");
      }

      await mutate();
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error("Error updating city:", error);
      alert("Failed to update city");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCityForm.name || !newCityForm.country) {
      alert("Please fill in at least city name and country");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCityForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create city");
      }

      await mutate();
      setShowAddForm(false);
      setNewCityForm({
        name: "",
        country: "",
        countryCode: "",
        latitude: 0,
        longitude: 0,
        safetyRating: 5,
        officialStatus: "unknown",
      });
    } catch (error) {
      console.error("Error creating city:", error);
      alert(error instanceof Error ? error.message : "Failed to create city");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cities Management</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage cities and their metadata
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Back to Reviews
            </Link>
          </Button>
        </div>

        {/* Search and Add */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-5 w-5" />
                Add City
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add City Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New City</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="City Name"
                  value={newCityForm.name}
                  onChange={(e) => setNewCityForm({ ...newCityForm, name: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Country"
                  value={newCityForm.country}
                  onChange={(e) => setNewCityForm({ ...newCityForm, country: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Country Code (e.g., US)"
                  value={newCityForm.countryCode}
                  onChange={(e) => setNewCityForm({ ...newCityForm, countryCode: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Latitude"
                  value={newCityForm.latitude}
                  onChange={(e) => setNewCityForm({ ...newCityForm, latitude: parseFloat(e.target.value) })}
                />
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Longitude"
                  value={newCityForm.longitude}
                  onChange={(e) => setNewCityForm({ ...newCityForm, longitude: parseFloat(e.target.value) })}
                />
                <select
                  value={newCityForm.officialStatus}
                  onChange={(e) => setNewCityForm({ ...newCityForm, officialStatus: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="unknown">Unknown</option>
                  <option value="safe">Safe</option>
                  <option value="unsafe">Unsafe</option>
                <option value="caution">Caution</option>
                </select>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleAddCity}
                  disabled={saving}
                >
                  {saving ? "Adding..." : "Add City"}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cities Stats */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Total Cities: <span className="font-semibold">{cities?.length || 0}</span>
              {searchQuery && (
                <span className="ml-4">
                  Filtered: <span className="font-semibold">{filteredCities.length}</span>
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Cities Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Avg Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCities.map((city) => (
                <TableRow key={city.id}>
                  {editingId === city.id && editForm ? (
                    <>
                      <TableCell>
                        <Input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={editForm.country}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            step="0.000001"
                            value={editForm.latitude}
                            onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) })}
                            placeholder="Latitude"
                          />
                          <Input
                            type="number"
                            step="0.000001"
                            value={editForm.longitude}
                            onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) })}
                            placeholder="Longitude"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {city.reviewCount || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {city.avgSafetyRating?.toFixed(1) || "N/A"}
                      </TableCell>
                      <TableCell>
                        <select
                          value={editForm.officialStatus}
                          onChange={(e) => setEditForm({ ...editForm, officialStatus: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="unknown">Unknown</option>
                          <option value="safe">Safe</option>
                          <option value="unsafe">Unsafe</option>
                          <option value="caution">Caution</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleSave(city.id)}
                            disabled={saving}
                            size="icon"
                            variant="ghost"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="icon"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">{city.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{city.country}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{city.reviewCount || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {city.avgSafetyRating?.toFixed(1) || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            city.officialStatus === "safe" ? "success" :
                            city.officialStatus === "unsafe" ? "destructive" :
                            city.officialStatus === "caution" ? "warning" :
                            "secondary"
                          }
                        >
                          {city.officialStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(city)}
                            size="icon"
                            variant="ghost"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(city.id)}
                            disabled={deletingId === city.id}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
