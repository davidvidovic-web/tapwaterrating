"use client";

import { City } from "@/db/schema";
import { useEffect, useState } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
// New Places API (V1) Response Type
type GooglePlaceSuggestion = {
  placePrediction: {
    place: string; // resource name, e.g. "places/ChIJ..."
    placeId: string;
    text: {
      text: string;
      matches: { endOffset: number }[];
    };
    structuredFormat: {
      mainText: { text: string; matches: { endOffset: number }[] };
      secondaryText?: { text: string };
    };
    location: {
      lat: number;
      lng: number;
    };
    address?: any;
  };
};

type SearchResult = 
  | { type: 'city', data: City }
  | { type: 'google', data: GooglePlaceSuggestion };

type Props = {
  cities: City[];
  onSelect: (city: City) => void;
  onGeolocation?: (lat: number, lng: number) => void;
  collapsed?: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

export function SearchBar({ cities, onSelect, onGeolocation, collapsed = false, onExpandChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandChange?.(expanded);
  };
  const [isLoading, setIsLoading] = useState(false);
  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useGeolocation();
  const [showError, setShowError] = useState(false);

  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      // Use exact geolocation coordinates if handler is provided
      if (onGeolocation) {
        onGeolocation(latitude, longitude);
      } else if (cities.length > 0) {
        // Fallback to nearest city if no geolocation handler
        try {
          const nearestCity = findNearestCity(latitude, longitude, cities);
          if (nearestCity) {
            onSelect(nearestCity);
          }
        } catch (err) {
          // Silently handle error to prevent breaking the UI
        }
      }
    }
  }, [latitude, longitude, cities, onSelect, onGeolocation]);

  // Show error notification when geolocation fails
  useEffect(() => {
    if (locationError) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [locationError]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setIsLoading(true);
      try {
        // Fetch from both sources in parallel
        const [dbRes, googleRes] = await Promise.all([
          fetch(`/api/cities?search=${encodeURIComponent(debouncedQuery)}&limit=3`, { signal: controller.signal }),
          fetch(`/api/places/autocomplete?input=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }).catch(() => null)
        ]);

        const dbData = dbRes.ok ? ((await dbRes.json()) as City[]) : [];
        let googleData: GooglePlaceSuggestion[] = [];

        if (googleRes && googleRes.ok) {
          const googleJson = await googleRes.json().catch(() => null);
          // V1 API returns { suggestions: [...] }
          if (googleJson && googleJson.suggestions) {
            googleData = googleJson.suggestions;
          }
        }

        // Combine and deduplicate
        const combinedResults: SearchResult[] = [];
        
        // Add DB results first
        dbData.forEach(city => {
          combinedResults.push({ type: 'city', data: city });
        });

        // Add Google results if they don't roughly match a DB result
        googleData.forEach(suggestion => {
          // Simple deduplication: Check if place name is already in DB results
          const mainText = suggestion.placePrediction.structuredFormat.mainText.text;
          const isDuplicate = dbData.some(city => 
            city.name.toLowerCase() === mainText.toLowerCase()
          );

          if (!isDuplicate) {
            combinedResults.push({ type: 'google', data: suggestion });
          }
        });

        setResults(combinedResults.slice(0, 3)); // Limit total results
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Search failed:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [debouncedQuery]);

  const shouldCollapse = (collapsed && !isExpanded) || (!collapsed && !isExpanded);

  return (
    <div className="relative w-full max-w-xl">
      <div className={`
        glass-panel glass-panel-pill backdrop-blur flex items-center transition-all
        ${shouldCollapse ? 'px-2 py-2 justify-between' : 'px-4 py-2.5'}
      `}>
        {/* Search section - always on left */}
        {shouldCollapse ? (
          <button
            onClick={() => handleExpand(true)}
            className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--c-content)' }}
            title="Search cities"
          >
            <Search className="h-5 w-5" />
          </button>
        ) : (
          <>
            <Search className="mr-3 h-5 w-5" style={{ color: 'var(--c-content)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => {
                if (!query && collapsed) {
                  setTimeout(() => handleExpand(false), 200);
                }
              }}
              placeholder="Where are you tapping?"
              className="w-full bg-transparent text-base font-medium focus:outline-none"
              style={{ fontSize: '16px', color: 'var(--c-content)' }}
              autoFocus={isExpanded}
            />
            {!shouldCollapse && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  handleExpand(false);
                }}
                className="mr-2 flex items-center justify-center rounded-full p-1 text-gray-600 dark:text-gray-400 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100"
                title={query ? "Clear search" : "Close search"}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isLoading && (
              <div className="mr-2 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                <div className="h-full w-full animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              </div>
            )}
          </>
        )}
        
        {!shouldCollapse && <div className="mx-2 h-6 w-px bg-gray-400/40 dark:bg-gray-600/40" />}
        
        {/* Location button - always on right */}
        <button
          onClick={requestLocation}
          disabled={locationLoading}
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-blue-600 disabled:opacity-50"
          style={{ color: 'var(--c-content)' }}
          title="Use my location"
        >
          {locationLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Error notification */}
      {showError && locationError && (
        <div className="absolute top-full mt-2 w-full rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/95 dark:bg-red-950/95 px-4 py-3 text-sm text-red-700 dark:text-red-300 shadow-lg backdrop-blur-[3px] z-50">
          {locationError}
        </div>
      )}

      {results.length > 0 && (
        <ul className="glass-panel glass-panel-rounded absolute top-full mt-2 w-full divide-y divide-gray-200/30 dark:divide-gray-700/30 py-2 z-50">
          {results.map((result) => {
            if (result.type === 'city') {
              const city = result.data;
              return (
                <li key={`city-${city.id}`}>
                  <button
                    type="button"
                    className="mx-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-white/40 dark:hover:bg-gray-800/40"
                    onClick={() => {
                      onSelect(city);
                      setQuery("");
                      setResults([]);
                      handleExpand(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{city.name}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{city.country}</span>
                    </div>
                    <span className="rounded-full bg-blue-100/60 dark:bg-blue-950/60 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 backdrop-blur-[3px]">
                      Rated
                    </span>
                  </button>
                </li>
              );
            } else {
              const suggestion = result.data;
              const placeId = suggestion.placePrediction.placeId;
              const mainText = suggestion.placePrediction.structuredFormat.mainText.text;
              const secondaryText = suggestion.placePrediction.structuredFormat.secondaryText?.text || "";
              const location = suggestion.placePrediction.location;

              return (
                <li key={`google-${placeId}`}>
                  <button
                    type="button"
                    className="mx-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-white/40 dark:hover:bg-gray-800/40"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        // Use location data directly from autocomplete
                        if (!location || !location.lat || !location.lng) {
                          throw new Error("Location data not available");
                        }
                        
                        // Construct a temporary city object
                        const tempCity: City = {
                          id: "-1",
                          name: mainText,
                          country: secondaryText.split(',').pop()?.trim() || "", // Rough estimation
                          countryCode: "XX", // We might not get this easily without more parsing
                          latitude: location.lat,
                          longitude: location.lng,
                          safetyRating: 0,
                          officialStatus: "unknown",
                          avgSafetyRating: 0,
                          avgTasteRating: 0,
                          reviewCount: 0,
                          phLevel: null,
                          hardness: null,
                          chlorineLevel: null,
                          tds: null,
                          waterSource: null,
                          treatmentProcess: null,
                          localAdvice: null,
                          dataSource: null,
                          lastUpdated: new Date(),
                          createdAt: new Date(),
                        };
                        
                        onSelect(tempCity);
                        setQuery("");
                        setResults([]);
                        handleExpand(false);
                      } catch (error) {
                        console.error("Error selecting place:", error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{mainText}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{secondaryText}</span>
                    </div>
                    <span className="rounded-full bg-gray-100/60 dark:bg-gray-800/60 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 backdrop-blur-[3px]">
                      Map
                    </span>
                  </button>
                </li>
              );
            }
          })}
        </ul>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Haversine formula to calculate distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function findNearestCity(lat: number, lon: number, cities: City[]): City | null {
  if (cities.length === 0) return null;

  let nearestCity = cities[0];
  let minDistance = getDistance(lat, lon, nearestCity.latitude, nearestCity.longitude);

  for (let i = 1; i < cities.length; i++) {
    const distance = getDistance(lat, lon, cities[i].latitude, cities[i].longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = cities[i];
    }
  }

  return nearestCity;
}
