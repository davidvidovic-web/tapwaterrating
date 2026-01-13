"use client";

import useSWR from "swr";
import { Review, City } from "@/db/schema";
import { Trash2, MapPin, Edit2, Save, X, Eye, EyeOff, User, LogOut, Building2, Download, FileText, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [searchQuery, setSearchQuery] = useState("");
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
      <div className="fixed inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Checking Authentication</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your access...</p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Review Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage and moderate water quality reviews</p>
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-white/40 dark:border-gray-800 backdrop-blur-[3px] p-12 shadow-xl">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto"></div>
              <p className="text-lg text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publishedCount = reviews.filter(r => r.isPublished).length;
  const unpublishedCount = reviews.length - publishedCount;

  // Filter reviews based on status and search query
  const filteredReviews = reviews.filter(review => {
    // Status filter
    if (statusFilter === "published" && !review.isPublished) return false;
    if (statusFilter === "hidden" && review.isPublished) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const cityName = getCityName(review.cityId).toLowerCase();
      const locationName = getLocationName(review).toLowerCase();
      const reviewText = (review.reviewText || "").toLowerCase();
      const waterSource = (review.waterSource || "").toLowerCase();
      
      return (
        cityName.includes(query) ||
        locationName.includes(query) ||
        reviewText.includes(query) ||
        waterSource.includes(query)
      );
    }
    
    return true;
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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Review Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage and moderate water quality reviews</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-[3px] text-gray-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                  <User className="h-4 w-4" />
                  {session?.user?.name || session?.user?.email || "Profile"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-white/40 dark:border-gray-700 bg-white/90 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-gray-200">
                <DropdownMenuLabel className="text-gray-900 dark:text-white">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name || "Admin"}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{session?.user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                      <span className="text-emerald-600 dark:text-emerald-400">{session?.user?.role}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-700 dark:hover:text-red-300 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-red-700 dark:focus:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNav />
        {/* Bulk Update Actions Section */}
        <Card className="mb-6 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Bulk Update Tools</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Update locations and cities from review data using Nominatim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* City Updates */}
              <Card className="border-blue-200/50 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-950/30 backdrop-blur-[3px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <MapPin className="h-4 w-4" />
                    City Management
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Analyzes all review locations to create/update city entries with proper center coordinates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={bulkUpdateCityCoordinates}
                    disabled={bulkUpdatingCities || bulkUpdatingReviews || !reviews}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
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
              <Card className="border-cyan-200/50 dark:border-cyan-800/40 bg-cyan-50/60 dark:bg-cyan-950/30 backdrop-blur-[3px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <MapPin className="h-4 w-4" />
                    Review Locations
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Updates missing street addresses and location names for all reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={bulkUpdateLocations}
                    disabled={bulkUpdatingReviews || bulkUpdatingCities || !reviews}
                    className="w-full border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700"
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
              <div className="mt-4 rounded-lg bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {bulkUpdatingCities ? 'Updating cities...' : 'Updating review locations...'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Please wait... This may take several minutes. Check the console for detailed progress.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter and Pagination Controls */}
        <Card className="mb-4 border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Search Input */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search cities, locations, reviews..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-[300px] border-white/40 dark:border-gray-700 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] pl-10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Filter:</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusFilterChange("all")}
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    className={statusFilter === "all" ? "bg-blue-600 text-white hover:bg-blue-700" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                  >
                    All ({reviews.length})
                  </Button>
                  <Button
                    onClick={() => handleStatusFilterChange("published")}
                    variant={statusFilter === "published" ? "default" : "outline"}
                    size="sm"
                    className={statusFilter === "published" ? "bg-blue-600 text-white hover:bg-blue-700" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                  >
                    <Eye className="h-4 w-4" />
                    Published ({publishedCount})
                  </Button>
                  <Button
                    onClick={() => handleStatusFilterChange("hidden")}
                    variant={statusFilter === "hidden" ? "default" : "outline"}
                    size="sm"
                    className={statusFilter === "hidden" ? "bg-blue-600 text-white hover:bg-blue-700" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                  >
                    <EyeOff className="h-4 w-4" />
                    Hidden ({unpublishedCount})
                  </Button>
                </div>
              </div>

              {/* Items Per Page */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Items per page:</span>
                <div className="flex gap-2">
                  {[10, 20, 50, 100, 200].map((size) => (
                    <Button
                      key={size}
                      onClick={() => handleItemsPerPageChange(size)}
                      variant={itemsPerPage === size ? "default" : "outline"}
                      size="sm"
                      className={itemsPerPage === size ? "bg-blue-600 text-white hover:bg-blue-700" : "border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredReviews.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredReviews.length)} of {filteredReviews.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm font-medium text-gray-900 dark:text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/30 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <TableHead className="text-gray-700 dark:text-gray-300">Location</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Ratings</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Details</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReviews.map((review) => {
                const isEditing = editingId === review.id;
                const isDeleting = deletingId === review.id;

                if (isEditing && editForm) {
                  return (
                    <TableRow key={review.id} className="border-white/30 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-[3px]">
                      <TableCell colSpan={6} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            {getCityName(review.cityId)} - {getLocationName(review)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Safety Rating */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Safety Rating</label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    size="icon"
                                    variant={editForm.safetyRating >= rating ? "default" : "outline"}
                                    onClick={() => setEditForm({ ...editForm, safetyRating: rating })}
                                    className={editForm.safetyRating >= rating ? "bg-blue-600 text-white hover:bg-blue-700" : "border-white/40 dark:border-gray-600 bg-white/60 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600"}
                                  >
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Taste Rating */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Taste Rating</label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    size="icon"
                                    variant={editForm.tasteRating >= rating ? "secondary" : "outline"}
                                    onClick={() => setEditForm({ ...editForm, tasteRating: rating })}
                                    className={editForm.tasteRating >= rating ? "bg-blue-500 dark:bg-gray-700 text-white hover:bg-blue-600 dark:hover:bg-gray-600" : "border-white/40 dark:border-gray-600 bg-white/60 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600"}
                                  >
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Review Text */}
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Review Text</label>
                            <textarea
                              value={editForm.reviewText}
                              onChange={(e) => setEditForm({ ...editForm, reviewText: e.target.value })}
                              rows={2}
                              className="w-full rounded-md border border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                              placeholder="Enter review text..."
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            {/* pH Level */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">pH Level</label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="14"
                                value={editForm.phLevel ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, phLevel: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="7.0"
                                className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white placeholder:text-gray-500"
                              />
                            </div>

                            {/* Hardness */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Hardness</label>
                              <select
                                value={editForm.hardness ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, hardness: e.target.value as any || null })}
                                className="flex h-9 w-full rounded-md border border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
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
                              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
                              <Input
                                type="text"
                                value={editForm.waterSource ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, waterSource: e.target.value || null })}
                                placeholder="municipal"
                                className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white placeholder:text-gray-500"
                              />
                            </div>

                            {/* Treatment */}
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Treatment</label>
                              <Input
                                type="text"
                                value={editForm.treatmentProcess ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, treatmentProcess: e.target.value || null })}
                                placeholder="chlorination"
                                className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white placeholder:text-gray-500"
                              />
                            </div>
                          </div>

                          {/* Location Information */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Location Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Latitude */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                                <Input
                                  type="number"
                                  step="0.000001"
                                  value={editForm.latitude}
                                  onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || 0 })}
                                  className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white"
                                />
                              </div>

                              {/* Longitude */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                                <Input
                                  type="number"
                                  step="0.000001"
                                  value={editForm.longitude}
                                  onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || 0 })}
                                  className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white"
                                />
                              </div>

                              {/* Street Address */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</label>
                                <Input
                                  type="text"
                                  value={editForm.streetAddress ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value || null })}
                                  placeholder="123 Main St"
                                  className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white placeholder:text-gray-500"
                                />
                              </div>

                              {/* Location Name */}
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Location Name</label>
                                <Input
                                  type="text"
                                  value={editForm.locationName ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value || null })}
                                  placeholder="Neighborhood"
                                  className="border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] text-gray-900 dark:text-white placeholder:text-gray-500"
                                />
                              </div>

                              {/* City Selector */}
                              <div className="col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                <select
                                  value={editForm.cityId}
                                  onChange={(e) => setEditForm({ ...editForm, cityId: e.target.value })}
                                  className="flex h-9 w-full rounded-md border border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 backdrop-blur-[3px] px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
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
                                  className="w-full border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700"
                                >
                                  {geocoding ? "Fetching location..." : "Update Address from Coordinates"}
                                </Button>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
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
                                className="h-4 w-4 rounded border-white/40 dark:border-gray-600 bg-white/80 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</span>
                            </label>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSave(review.id)}
                              disabled={saving}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Save className="h-4 w-4" />
                              {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              variant="outline"
                              className="border-white/40 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 backdrop-blur-[3px] text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
                  <TableRow key={review.id} className="border-white/30 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    {/* Location */}
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{getCityName(review.cityId)}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{getLocationName(review)}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Ratings */}
                    <TableCell>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1">
                          <Badge variant="default" className="bg-blue-600 text-white">
                            {review.safetyRating}
                          </Badge>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Safety</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-gray-200">
                            {review.tasteRating}
                          </Badge>
                          <span className="text-xs text-gray-400">Taste</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Details */}
                    <TableCell>
                      <div className="max-w-md">
                        {review.reviewText ? (
                          <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{review.reviewText}</p>
                        ) : (
                          <p className="text-sm italic text-gray-500 dark:text-gray-500">No text</p>
                        )}
                        {(review.phLevel || review.hardness || review.waterSource || review.treatmentProcess) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {review.phLevel && (
                              <Badge variant="outline" className="border-blue-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                pH: {review.phLevel}
                              </Badge>
                            )}
                            {review.hardness && (
                              <Badge variant="outline" className="capitalize border-blue-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {review.hardness.replace('-', ' ')}
                              </Badge>
                            )}
                            {review.waterSource && (
                              <Badge variant="outline" className="capitalize border-blue-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {review.waterSource}
                              </Badge>
                            )}
                            {review.treatmentProcess && (
                              <Badge variant="outline" className="capitalize border-blue-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
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
                        <Badge variant="success" className="bg-emerald-600 text-white">
                          <Eye className="h-3 w-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="bg-amber-600 text-white">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
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
                          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        >
                          {review.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => handleEdit(review)}
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(review.id)}
                          disabled={isDeleting}
                          size="icon"
                          variant="ghost"
                          title="Delete"
                          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400"
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
