"use client";

import useSWR from "swr";
import { City } from "@/db/schema";
import { Trash2, Edit2, Save, X, Plus, Merge, Search, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardNav } from "@/components/dashboard-nav";

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
  const [mergingCity, setMergingCity] = useState<City | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [merging, setMerging] = useState(false);
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

  // Find all duplicate groups (cities with exact same name, case-insensitive)
  const getDuplicateGroups = () => {
    if (!cities) return [];
    
    const nameMap = new Map<string, City[]>();
    
    cities.forEach(city => {
      // Normalize name: lowercase, trim whitespace
      const normalizedName = city.name.toLowerCase().trim();
      const existing = nameMap.get(normalizedName) || [];
      existing.push(city);
      nameMap.set(normalizedName, existing);
    });
    
    // Return only groups with more than one city (actual duplicates)
    return Array.from(nameMap.entries())
      .filter(([, group]) => group.length > 1)
      .map(([name, group]) => ({ name, cities: group }))
      .sort((a, b) => b.cities.length - a.cities.length);
  };

  const duplicateGroups = getDuplicateGroups();

  // Find potential duplicates for a specific city (for the warning icon)
  const findPotentialDuplicates = (city: City) => {
    if (!cities) return [];
    const normalizedName = city.name.toLowerCase().trim();
    return cities.filter(c => {
      if (c.id === city.id) return false;
      return c.name.toLowerCase().trim() === normalizedName;
    });
  };

  const handleMerge = async (sourceId: string, targetId: string, sourceName: string) => {
    if (!confirm(`Are you sure you want to merge "${sourceName}" into the selected city? This will move all reviews and delete "${sourceName}".`)) {
      return;
    }

    setMerging(true);
    try {
      const response = await fetch('/api/cities/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge cities');
      }

      const result = await response.json();
      alert(result.message);
      await mutate();
      setMergingCity(null);
      setMergeTargetId('');
    } catch (error) {
      console.error('Error merging cities:', error);
      alert(error instanceof Error ? error.message : 'Failed to merge cities');
    } finally {
      setMerging(false);
    }
  };

  const handleMergeFromModal = async () => {
    if (!mergingCity || !mergeTargetId) return;
    await handleMerge(mergingCity.id, mergeTargetId, mergingCity.name);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cities Management</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage cities and their metadata
            </p>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNav />
        {/* Search and Add */}
        <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-white/40 dark:border-gray-700 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white"
                />
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-5 w-5" />
                Add City
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Cities Section */}
        {duplicateGroups.length > 0 && (
          <Card className="mb-6 border-orange-300 dark:border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 backdrop-blur-[3px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                Duplicate Cities Found ({duplicateGroups.length} groups)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                The following cities have duplicate entries. Select which one to keep and merge the others into it.
              </p>
              <div className="space-y-4">
                {duplicateGroups.map((group) => (
                  <div key={group.name} className="rounded-lg border bg-background p-4">
                    <h4 className="mb-3 font-semibold capitalize">{group.name}</h4>
                    <div className="space-y-2">
                      {group.cities.map((city) => (
                        <div key={city.id} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                          <div className="flex-1">
                            <span className="font-medium">{city.name}</span>
                            <span className="mx-2 text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{city.country}</span>
                            <span className="mx-2 text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{city.reviewCount || 0} reviews</span>
                            <span className="mx-2 text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              ({city.latitude.toFixed(4)}, {city.longitude.toFixed(4)})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {group.cities.filter(c => c.id !== city.id).map(otherCity => (
                              <Button
                                key={otherCity.id}
                                size="sm"
                                variant="outline"
                                disabled={merging}
                                onClick={() => handleMerge(city.id, otherCity.id, city.name)}
                                title={`Merge into ${otherCity.name} (${otherCity.reviewCount || 0} reviews)`}
                              >
                                {merging ? '...' : `→ Merge into ${otherCity.reviewCount || 0}r`}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Merge City Modal */}
        {mergingCity && (
          <Card className="mb-6 border-orange-300 dark:border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 backdrop-blur-[3px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-500">
                <Merge className="h-5 w-5" />
                Merge City: {mergingCity.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Select the target city to merge &quot;{mergingCity.name}&quot; into. All reviews will be moved to the target city, and &quot;{mergingCity.name}&quot; will be deleted.
              </p>
              <div className="flex gap-4">
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="flex-1 rounded-md border border-white/40 dark:border-gray-700 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value="">Select target city...</option>
                  {/* Show duplicates first, then all other cities */}
                  {findPotentialDuplicates(mergingCity).length > 0 && (
                    <optgroup label="Suggested (same name)">
                      {findPotentialDuplicates(mergingCity).map(city => (
                        <option key={city.id} value={city.id}>
                          ⭐ {city.name}, {city.country} ({city.reviewCount || 0} reviews)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All cities">
                    {cities?.filter(c => c.id !== mergingCity.id && !findPotentialDuplicates(mergingCity).some(d => d.id === c.id)).map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country} ({city.reviewCount || 0} reviews)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <Button
                  onClick={handleMergeFromModal}
                  disabled={!mergeTargetId || merging}
                  variant="destructive"
                >
                  {merging ? 'Merging...' : 'Merge'}
                </Button>
                <Button
                  onClick={() => { setMergingCity(null); setMergeTargetId(''); }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add City Form */}
        {showAddForm && (
          <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Add New City</CardTitle>
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
                  className="flex h-9 w-full rounded-md border border-white/40 dark:border-gray-700 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
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
        <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
        <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/30 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <TableHead className="text-gray-700 dark:text-gray-300">City</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Country</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Coordinates</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Reviews</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Avg Rating</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCities.map((city) => (
                <TableRow key={city.id} className="border-white/30 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
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
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {city.reviewCount || 0}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {city.avgSafetyRating?.toFixed(1) || "N/A"}
                      </TableCell>
                      <TableCell>
                        <select
                          value={editForm.officialStatus}
                          onChange={(e) => setEditForm({ ...editForm, officialStatus: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-white/40 dark:border-gray-700 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
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
                        <div className="flex justify-end gap-1">
                          {findPotentialDuplicates(city).length > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-orange-500 hover:text-orange-600"
                              title={`Potential duplicates: ${findPotentialDuplicates(city).map(c => c.name).join(', ')}`}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => setMergingCity(city)}
                            size="icon"
                            variant="ghost"
                            title="Merge into another city"
                          >
                            <Merge className="h-4 w-4" />
                          </Button>
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
