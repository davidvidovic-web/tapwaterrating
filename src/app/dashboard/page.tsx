"use client";

import useSWR from "swr";
import { Review, City } from "@/db/schema";
import { Trash2, MapPin, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type EditingReview = {
  tasteRating: number;
  safetyRating: number;
  reviewText: string;
  phLevel: number | null;
  hardness: "soft" | "medium" | "hard" | "very-hard" | null;
  waterSource: string | null;
  treatmentProcess: string | null;
  isPublished: boolean;
  latitude: number;
  longitude: number;
  streetAddress: string | null;
  locationName: string | null;
  cityId: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: reviews, mutate } = useSWR<Review[]>("/api/reviews?showAll=true", fetcher);
  const { data: cities } = useSWR<City[]>("/api/cities?limit=100", fetcher);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [fetchedLocations, setFetchedLocations] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden">("all");
  const [bulkUpdatingReviews, setBulkUpdatingReviews] = useState(false);
  const [bulkUpdatingCities, setBulkUpdatingCities] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (!session) {
      router.push("/admin/login");
      return;
    }
    
    if (!session.user) {
      router.push("/admin/login");
      return;
    }
    
    if (session.user.role !== "admin") {
      router.push("/admin/login");
      return;
    }
  }, [session, status, router]);
  useEffect(() => {
    if (!reviews) return;
    
    const fetchMissingLocations = async () => {
      const toFetch = reviews.filter(
        r => !r.streetAddress && !r.locationName && !fetchedLocations[r.id]
      );
      
      if (toFetch.length === 0) return;
      
      const newLocations: Record<string, string> = {};
      
      for (const review of toFetch.slice(0, 5)) { // Fetch 5 at a time to avoid rate limits
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${review.latitude}&lon=${review.longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'TapWaterRating/1.0',
                'Accept-Language': 'en,sr-Latn,bs,hr,sl,sq'
              }
            }
          ).catch(err => {
            console.warn('Network error fetching location for review', review.id, ':', err.message);
            return null;
          });
          
          if (!response || !response.ok) {
            console.warn('Geocoding failed for review', review.id, response ? `with status: ${response.status}` : '(network error)');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          const data = await response.json();
          
          const address = data.address;
          if (address) {
            const parts = [];
            if (address.road) parts.push(address.road);
            if (address.neighbourhood || address.suburb) {
              parts.push(address.neighbourhood || address.suburb);
            }
            if (parts.length > 0) {
              newLocations[review.id] = parts.join(", ");
            } else if (address.city || address.town || address.village) {
              newLocations[review.id] = address.city || address.town || address.village;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn("Failed to process location for review", review.id, ":", error);
        }
      }
      
      setFetchedLocations(prev => ({ ...prev, ...newLocations }));
    };
    
    fetchMissingLocations();
  }, [reviews, fetchedLocations]);

  const getCityName = (cityId: string) => {
    if (!cities) return cityId;
    const city = cities.find(c => c.id === cityId);
    return city ? `${city.name}, ${city.country}` : cityId;
  };
  
  const getLocationName = (review: Review) => {
    // Try cached data first
    if (review.streetAddress && review.locationName) {
      return `${review.streetAddress}, ${review.locationName}`;
    }
    if (review.streetAddress) return review.streetAddress;
    if (review.locationName) return review.locationName;
    
    // Try fetched data
    if (fetchedLocations[review.id]) {
      return fetchedLocations[review.id];
    }
    
    // Fallback to coordinates
    return `${review.latitude.toFixed(4)}, ${review.longitude.toFixed(4)}`;
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeletingId(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      await mutate();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({
      tasteRating: review.tasteRating,
      safetyRating: review.safetyRating,
      reviewText: review.reviewText || "",
      phLevel: review.phLevel ?? null,
      hardness: review.hardness ?? null,
      waterSource: review.waterSource ?? null,
      treatmentProcess: review.treatmentProcess ?? null,
      isPublished: review.isPublished ?? true,
      latitude: review.latitude,
      longitude: review.longitude,
      streetAddress: review.streetAddress ?? null,
      locationName: review.locationName ?? null,
      cityId: review.cityId,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async (reviewId: string) => {
    if (!editForm) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update review");
      }

      await mutate();
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const fetchLocationFromCoordinates = async () => {
    if (!editForm) return;

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${editForm.latitude}&lon=${editForm.longitude}&zoom=18&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'TapWaterRating/1.0',
            'Accept-Language': 'en'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      const address = data.address;

      if (address) {
        // Build street address
        const streetParts = [];
        if (address.road) streetParts.push(address.road);
        if (address.house_number) streetParts.push(address.house_number);
        const streetAddress = streetParts.length > 0 ? streetParts.join(' ') : null;

        // Build location name (neighborhood/area)
        const locationName = address.neighbourhood || address.suburb || address.city || address.town || address.village || null;

        // Extract city name and country
        const cityName = address.city || address.town || address.village || address.municipality || address.county || address.state;
        const country = address.country;

        console.log(`Found location: ${cityName}, ${country}`);

        let cityId = editForm.cityId;

        if (cityName && country) {
          // Search for the city center coordinates
          const searchResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country)}&format=json&limit=1&accept-language=en`,
            {
              headers: {
                'User-Agent': 'TapWaterRating/1.0',
                'Accept-Language': 'en'
              }
            }
          );

          if (searchResponse.ok) {
            const searchResults = await searchResponse.json();
            if (searchResults && searchResults.length > 0) {
              const cityLat = parseFloat(searchResults[0].lat);
              const cityLng = parseFloat(searchResults[0].lon);

              // Look for existing city by name and country first, then by proximity
              let existingCity = cities?.find(
                c => c.name === cityName && c.country === country
              );

              if (!existingCity) {
                existingCity = cities?.find(
                  c => Math.abs(c.latitude - cityLat) < 0.005 && Math.abs(c.longitude - cityLng) < 0.005 && c.name === cityName
                );
              }

              if (existingCity) {
                console.log(`✓ Found existing city: ${existingCity.name}`);
                cityId = existingCity.id;
              } else {
                // Create new city
                console.log(`Creating new city: ${cityName}, ${country}`);
                const createResponse = await fetch('/api/cities', {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: cityName,
                    country: country,
                    latitude: cityLat,
                    longitude: cityLng,
                  }),
                });

                if (createResponse.ok) {
                  const newCity = await createResponse.json();
                  cityId = newCity.id;
                  console.log(`✓ Created new city with ID: ${cityId}`);
                  // Refresh cities list
                  window.location.reload();
                } else {
                  console.error('Failed to create city');
                }
              }
            }
          }
        }

        setEditForm({
          ...editForm,
          streetAddress,
          locationName,
          cityId,
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      alert('Failed to fetch location data. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const bulkUpdateLocations = async () => {
    if (!reviews) return;
    if (!confirm(`This will update location data for all ${reviews.length} reviews. This may take several minutes. Continue?`)) {
      return;
    }

    setBulkUpdatingReviews(true);
    setBulkProgress({ current: 0, total: reviews.length });

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        setBulkProgress({ current: i + 1, total: reviews.length });
        console.log(`[${i + 1}/${reviews.length}] Processing review #${review.id.substring(0, 8)}...`);

        try {
          // Fetch location from Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${review.latitude}&lon=${review.longitude}&zoom=18&addressdetails=1&accept-language=en`,
            {
              headers: {
                'User-Agent': 'TapWaterRating/1.0',
                'Accept-Language': 'en'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address;

            if (address) {
              // Build street address
              const streetParts = [];
              if (address.road) streetParts.push(address.road);
              if (address.house_number) streetParts.push(address.house_number);
              const streetAddress = streetParts.length > 0 ? streetParts.join(' ') : null;

              // Build location name
              const locationName = address.neighbourhood || address.suburb || address.city || address.town || address.village || null;

              // Update review in database
              const updateResponse = await fetch(`/api/reviews/${review.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ streetAddress, locationName }),
              });

              if (updateResponse.ok) {
                successCount++;
                console.log(`  ✓ Updated`);
              } else {
                errorCount++;
                const errorText = await updateResponse.text();
                errors.push(`Review #${review.id.substring(0, 8)}: ${errorText}`);
                console.error(`  ✗ Update failed:`, errorText);
              }
            }
          } else {
            errorCount++;
            errors.push(`Review #${review.id.substring(0, 8)}: Geocode failed`);
            console.error(`  ✗ Geocode failed`);
          }

          // Rate limiting: wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`  ✗ Error:`, errorMsg);
          errors.push(`Review #${review.id.substring(0, 8)}: ${errorMsg}`);
          errorCount++;
        }
      }

      await mutate();
      
      console.log('\n=== Review Location Update Summary ===');
      console.log(`Total reviews: ${reviews.length}`);
      console.log(`Successfully updated: ${successCount}`);
      console.log(`Failed: ${errorCount}`);
      if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(err => console.log(`  - ${err}`));
      }
      
      const summary = `Review Update Complete!\n\nTotal: ${reviews.length}\nUpdated: ${successCount}\nFailed: ${errorCount}${
        errorCount > 0 ? `\n\nFirst few errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}` : ''
      }\n\nCheck console for full details.`;
      
      alert(summary);
    } catch (error) {
      console.error("Bulk update error:", error);
      alert("Bulk update failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setBulkUpdatingReviews(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const bulkUpdateCityCoordinates = async () => {
    if (!reviews) return;
    
    // Extract unique city locations from reviews
    const uniqueLocations = new Map<string, { lat: number; lng: number }>();
    reviews.forEach(review => {
      const key = `${review.latitude.toFixed(4)},${review.longitude.toFixed(4)}`;
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, { lat: review.latitude, lng: review.longitude });
      }
    });
    
    const locationsArray = Array.from(uniqueLocations.values());
    
    if (!confirm(`This will check ${locationsArray.length} unique review locations and create/update cities using Nominatim. This may take several minutes. Continue?`)) {
      return;
    }

    setBulkUpdatingCities(true);
    setBulkProgress({ current: 0, total: locationsArray.length });

    try {
      let successCount = 0;
      let createdCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const successes: string[] = [];

      for (let i = 0; i < locationsArray.length; i++) {
        const location = locationsArray[i];
        const locationStr = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        setBulkProgress({ current: i + 1, total: locationsArray.length });
        console.log(`[${i + 1}/${locationsArray.length}] Processing location: ${locationStr}`);

        try {
          // Reverse geocode to get city data from Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=10&addressdetails=1&accept-language=en`,
            {
              headers: {
                'User-Agent': 'TapWaterRating/1.0',
                'Accept-Language': 'en'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            
            if (address) {
              // Extract city name and country
              const cityName = address.city || address.town || address.village || address.municipality || address.county || address.state;
              const country = address.country;
              
              console.log(`  Found: ${cityName}, ${country}`);
              
              if (cityName && country) {
                // Get proper city center coordinates by searching for the city
                const searchResponse = await fetch(
                  `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country)}&format=json&limit=1&accept-language=en`,
                  {
                    headers: {
                      'User-Agent': 'TapWaterRating/1.0',
                      'Accept-Language': 'en'
                    }
                  }
                );
                
                if (searchResponse.ok) {
                  const searchResults = await searchResponse.json();
                  if (searchResults && searchResults.length > 0) {
                    const cityLat = parseFloat(searchResults[0].lat);
                    const cityLng = parseFloat(searchResults[0].lon);
                    
                    // Look for existing city by name and country first, then by proximity
                    const existingCity = cities?.find(
                      c => c.name === cityName && c.country === country
                    ) || cities?.find(
                      c => Math.abs(c.latitude - cityLat) < 0.005 && Math.abs(c.longitude - cityLng) < 0.005 && c.name === cityName
                    );

                    if (existingCity) {
                      // Update existing city with Nominatim coordinates
                      const updateResponse = await fetch(`/api/cities/${existingCity.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ latitude: cityLat, longitude: cityLng }),
                      });

                      if (updateResponse.ok) {
                        successCount++;
                        successes.push(`Updated: ${cityName}, ${country}`);
                        console.log(`  ✓ Updated existing city: ${existingCity.name}`);
                      } else {
                        errorCount++;
                        const errorText = await updateResponse.text();
                        errors.push(`Update failed for ${cityName}: ${errorText}`);
                        console.error(`  ✗ Update failed:`, errorText);
                      }
                    } else {
                      // Create new city in database
                      const createResponse = await fetch('/api/cities', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: cityName,
                          country: country,
                          latitude: cityLat,
                          longitude: cityLng,
                        }),
                      });

                      if (createResponse.ok) {
                        createdCount++;
                        successes.push(`Created: ${cityName}, ${country}`);
                        console.log(`  ✓ Created new city: ${cityName}`);
                      } else {
                        errorCount++;
                        const errorText = await createResponse.text();
                        errors.push(`Create failed for ${cityName}: ${errorText}`);
                        console.error(`  ✗ Create failed:`, errorText);
                      }
                    }
                  } else {
                    errorCount++;
                    errors.push(`No city center found for ${cityName}, ${country}`);
                    console.error(`  ✗ No city center found`);
                  }
                } else {
                  errorCount++;
                  errors.push(`City search API error at ${locationStr}`);
                  console.error(`  ✗ City search API error`);
                }
              } else {
                errorCount++;
                errors.push(`Missing city name or country at ${locationStr}`);
                console.error(`  ✗ Missing city name or country`);
              }
            } else {
              errorCount++;
              errors.push(`No address data at ${locationStr}`);
              console.error(`  ✗ No address data`);
            }
          } else {
            errorCount++;
            errors.push(`Reverse geocode failed at ${locationStr}: ${response.status}`);
            console.error(`  ✗ Reverse geocode failed: ${response.status}`);
          }

          // Rate limiting: wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`  ✗ Error:`, errorMsg);
          errors.push(`Exception at ${locationStr}: ${errorMsg}`);
          errorCount++;
        }
      }

      console.log('\n=== City Update Summary ===');
      console.log(`Total locations checked: ${locationsArray.length}`);
      console.log(`Successfully updated: ${successCount}`);
      console.log(`Newly created: ${createdCount}`);
      console.log(`Failed: ${errorCount}`);
      if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(err => console.log(`  - ${err}`));
      }

      const summary = `City Update Complete!\n\nTotal locations: ${locationsArray.length}\nUpdated: ${successCount}\nCreated: ${createdCount}\nFailed: ${errorCount}${
        errorCount > 0 ? `\n\nFirst few errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}` : ''
      }\n\nCheck console for full details.`;
      
      alert(summary);
      // Reload the page to see updated city locations
      window.location.reload();
    } catch (error) {
      console.error("Bulk city update error:", error);
      alert("Bulk city update failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setBulkUpdatingCities(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const toggleVisibility = async (review: Review) => {
    try {
      const newStatus = !review.isPublished;
      
      // Optimistically update the UI
      mutate(
        reviews?.map(r => 
          r.id === review.id ? { ...r, isPublished: newStatus } : r
        ),
        false
      );

      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || "Failed to update visibility");
      }

      // Revalidate to ensure data is in sync
      await mutate();
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert("Failed to update visibility: " + (error instanceof Error ? error.message : "Unknown error"));
      // Revalidate on error to restore correct state
      await mutate();
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="fixed inset-0 bg-muted/30 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Checking Authentication</h2>
          <p className="text-muted-foreground">Please wait while we verify your access...</p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!session || session.user?.role !== "admin") {
    return null;
  }

  if (!reviews) {
    return (
      <div className="min-h-screen bg-muted/30 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Review Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage and moderate water quality reviews</p>
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-card/90 p-12 shadow-xl backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto"></div>
              <p className="text-lg text-muted-foreground">Loading reviews...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publishedCount = reviews.filter(r => r.isPublished).length;
  const unpublishedCount = reviews.length - publishedCount;

  // Filter reviews based on status
  const filteredReviews = reviews.filter(review => {
    if (statusFilter === "published") return review.isPublished;
    if (statusFilter === "hidden") return !review.isPublished;
    return true; // "all"
  });

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to page 1 when items per page or filter changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newFilter: "all" | "published" | "hidden") => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Review Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage and moderate water quality reviews</p>
            {session?.user && (
              <div className="mt-2 flex items-center gap-2 text-sm text-success">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                Logged in as {session.user.name || session.user.email} ({session.user.role})
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="default">
              <Link href="/dashboard/cities">
                Manage Cities
              </Link>
            </Button>
            <AuthButton />
          </div>
        </div>
        
        {/* Bulk Update Actions Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Update Tools</CardTitle>
            <CardDescription>Update locations and cities from review data using Nominatim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* City Updates */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    City Management
                  </CardTitle>
                  <CardDescription>
                    Analyzes all review locations to create/update city entries with proper center coordinates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={bulkUpdateCityCoordinates}
                    disabled={bulkUpdatingCities || bulkUpdatingReviews || !reviews}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4" />
                    {bulkUpdatingCities ? (
                      <span>Updating Cities {bulkProgress.current}/{bulkProgress.total}...</span>
                    ) : (
                      <span>Update City Centers ({reviews?.length || 0} reviews)</span>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Review Location Updates */}
              <Card className="border-info/20 bg-info/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    Review Locations
                  </CardTitle>
                  <CardDescription>
                    Updates missing street addresses and location names for all reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={bulkUpdateLocations}
                    disabled={bulkUpdatingReviews || bulkUpdatingCities || !reviews}
                    variant="secondary"
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4" />
                    {bulkUpdatingReviews ? (
                      <span>Updating Reviews {bulkProgress.current}/{bulkProgress.total}...</span>
                    ) : (
                      <span>Bulk Update Locations ({reviews?.length || 0} reviews)</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Progress Indicator */}
            {(bulkUpdatingCities || bulkUpdatingReviews) && (
              <div className="mt-4 rounded-lg bg-muted p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {bulkUpdatingCities ? 'Updating cities...' : 'Updating review locations...'}
                  </span>
                  <span className="text-muted-foreground">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Please wait... This may take several minutes. Check the console for detailed progress.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter and Pagination Controls */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">Filter:</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusFilterChange("all")}
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                  >
                    All ({reviews.length})
                  </Button>
                  <Button
                    onClick={() => handleStatusFilterChange("published")}
                    variant={statusFilter === "published" ? "default" : "outline"}
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                    Published ({publishedCount})
                  </Button>
                  <Button
                    onClick={() => handleStatusFilterChange("hidden")}
                    variant={statusFilter === "hidden" ? "default" : "outline"}
                    size="sm"
                  >
                    <EyeOff className="h-4 w-4" />
                    Hidden ({unpublishedCount})
                  </Button>
                </div>
              </div>

              {/* Items Per Page */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <div className="flex gap-2">
                  {[10, 20, 50, 100, 200].map((size) => (
                    <Button
                      key={size}
                      onClick={() => handleItemsPerPageChange(size)}
                      variant={itemsPerPage === size ? "default" : "outline"}
                      size="sm"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredReviews.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredReviews.length)} of {filteredReviews.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm font-medium text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Ratings</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReviews.map((review) => {
                const isEditing = editingId === review.id;
                const isDeleting = deletingId === review.id;

                if (isEditing && editForm) {
                  return (
                    <TableRow key={review.id} className="bg-muted/50">
                      <TableCell colSpan={6} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            {getCityName(review.cityId)} - {getLocationName(review)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Safety Rating */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">Safety Rating</label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    size="icon"
                                    variant={editForm.safetyRating >= rating ? "default" : "outline"}
                                    onClick={() => setEditForm({ ...editForm, safetyRating: rating })}
                                  >
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Taste Rating */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">Taste Rating</label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    size="icon"
                                    variant={editForm.tasteRating >= rating ? "secondary" : "outline"}
                                    onClick={() => setEditForm({ ...editForm, tasteRating: rating })}
                                  >
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Review Text */}
                          <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Review Text</label>
                            <textarea
                              value={editForm.reviewText}
                              onChange={(e) => setEditForm({ ...editForm, reviewText: e.target.value })}
                              rows={2}
                              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              placeholder="Enter review text..."
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            {/* pH Level */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">pH Level</label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="14"
                                value={editForm.phLevel ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, phLevel: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="7.0"
                              />
                            </div>

                            {/* Hardness */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">Hardness</label>
                              <select
                                value={editForm.hardness ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, hardness: e.target.value as any || null })}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                <option value="">-</option>
                                <option value="soft">Soft</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="very-hard">Very Hard</option>
                              </select>
                            </div>

                            {/* Water Source */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">Source</label>
                              <Input
                                type="text"
                                value={editForm.waterSource ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, waterSource: e.target.value || null })}
                                placeholder="municipal"
                              />
                            </div>

                            {/* Treatment */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">Treatment</label>
                              <Input
                                type="text"
                                value={editForm.treatmentProcess ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, treatmentProcess: e.target.value || null })}
                                placeholder="chlorination"
                              />
                            </div>
                          </div>

                          {/* Location Information */}
                          <div className="border-t pt-4">
                            <h4 className="mb-3 text-sm font-semibold text-foreground">Location Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Latitude */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Latitude</label>
                                <Input
                                  type="number"
                                  step="0.000001"
                                  value={editForm.latitude}
                                  onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || 0 })}
                                />
                              </div>

                              {/* Longitude */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Longitude</label>
                                <Input
                                  type="number"
                                  step="0.000001"
                                  value={editForm.longitude}
                                  onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || 0 })}
                                />
                              </div>

                              {/* Street Address */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Street Address</label>
                                <Input
                                  type="text"
                                  value={editForm.streetAddress ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value || null })}
                                  placeholder="123 Main St"
                                />
                              </div>

                              {/* Location Name */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Location Name</label>
                                <Input
                                  type="text"
                                  value={editForm.locationName ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value || null })}
                                  placeholder="Neighborhood"
                                />
                              </div>

                              {/* City Selector */}
                              <div className="col-span-2">
                                <label className="mb-1 block text-sm font-medium text-foreground">City</label>
                                <select
                                  value={editForm.cityId}
                                  onChange={(e) => setEditForm({ ...editForm, cityId: e.target.value })}
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  {cities?.map((city) => (
                                    <option key={city.id} value={city.id}>
                                      {city.name}, {city.country}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Update Location Button */}
                              <div className="col-span-2">
                                <Button
                                  type="button"
                                  onClick={fetchLocationFromCoordinates}
                                  disabled={geocoding}
                                  variant="secondary"
                                  className="w-full"
                                >
                                  {geocoding ? "Fetching location..." : "Update Address from Coordinates"}
                                </Button>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  This will fetch street address and location name based on the latitude/longitude above
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Published Toggle */}
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editForm.isPublished}
                                onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                                className="h-4 w-4 rounded border-input focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              />
                              <span className="text-sm font-medium text-foreground">Published</span>
                            </label>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSave(review.id)}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4" />
                              {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              variant="outline"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={review.id}>
                    {/* Location */}
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{getCityName(review.cityId)}</div>
                          <div className="text-xs text-muted-foreground">{getLocationName(review)}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Ratings */}
                    <TableCell>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1">
                          <Badge variant="default">
                            {review.safetyRating}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Safety</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">
                            {review.tasteRating}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Taste</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Details */}
                    <TableCell>
                      <div className="max-w-md">
                        {review.reviewText ? (
                          <p className="text-sm text-foreground line-clamp-2">{review.reviewText}</p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">No text</p>
                        )}
                        {(review.phLevel || review.hardness || review.waterSource || review.treatmentProcess) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {review.phLevel && (
                              <Badge variant="outline">
                                pH: {review.phLevel}
                              </Badge>
                            )}
                            {review.hardness && (
                              <Badge variant="outline" className="capitalize">
                                {review.hardness.replace('-', ' ')}
                              </Badge>
                            )}
                            {review.waterSource && (
                              <Badge variant="outline" className="capitalize">
                                {review.waterSource}
                              </Badge>
                            )}
                            {review.treatmentProcess && (
                              <Badge variant="outline" className="capitalize">
                                {review.treatmentProcess}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {review.isPublished ? (
                        <Badge variant="success">
                          <Eye className="h-3 w-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => toggleVisibility(review)}
                          size="icon"
                          variant="ghost"
                          title={review.isPublished ? "Hide review" : "Publish review"}
                        >
                          {review.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => handleEdit(review)}
                          size="icon"
                          variant="ghost"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(review.id)}
                          disabled={isDeleting}
                          size="icon"
                          variant="ghost"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
