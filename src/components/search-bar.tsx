"use client";

import { City } from "@/db/schema";
import { useEffect, useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";

type Props = {
  cities: City[];
  onSelect: (city: City) => void;
  collapsed?: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

export function SearchBar({ cities, onSelect, collapsed = false, onExpandChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandChange?.(expanded);
  };
  const [isLoading, setIsLoading] = useState(false);
  const { latitude, longitude, loading: locationLoading, requestLocation } = useGeolocation();

  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (latitude && longitude && cities.length > 0) {
      const nearestCity = findNearestCity(latitude, longitude, cities);
      if (nearestCity) {
        onSelect(nearestCity);
      }
    }
  }, [latitude, longitude, cities, onSelect]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/cities?search=${encodeURIComponent(debouncedQuery)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as City[];
        setResults(data);
      } finally {
        setIsLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [debouncedQuery]);

  const shouldCollapse = collapsed && !isExpanded;

  return (
    <div className="relative w-full max-w-xl">
      <div className={`
        flex items-center rounded-full border border-white/40 bg-white/60 shadow-lg backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-xl
        ${shouldCollapse ? 'px-2 py-2 justify-between' : 'px-4 py-2.5'}
      `}>
        {/* Search section - always on left */}
        {shouldCollapse ? (
          <button
            onClick={() => handleExpand(true)}
            className="flex items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-black/5 hover:text-blue-700"
            title="Search cities"
          >
            <Search className="h-5 w-5" />
          </button>
        ) : (
          <>
            <Search className="mr-3 h-5 w-5 text-gray-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => {
                if (!query && collapsed) {
                  setTimeout(() => handleExpand(false), 200);
                }
              }}
              placeholder="Where are you going?"
              className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-600 focus:outline-none"
              autoFocus={isExpanded}
            />
            {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />}
          </>
        )}
        
        {!shouldCollapse && <div className="mx-2 h-6 w-px bg-gray-400/40" />}
        
        {/* Location button - always on right */}
        <button
          onClick={requestLocation}
          disabled={locationLoading}
          className="flex items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-black/5 hover:text-blue-700 disabled:opacity-50"
          title="Use my location"
        >
          {locationLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full divide-y divide-gray-200/50 rounded-3xl border border-white/40 bg-white/60 py-2 shadow-2xl backdrop-blur-xl z-50">
          {results.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-white/40"
                onClick={() => {
                  onSelect(city);
                  setQuery("");
                  setResults([]);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{city.name}</span>
                  <span className="text-xs text-gray-600">{city.country}</span>
                </div>
                <span className="rounded-full bg-white/40 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
                  {city.countryCode}
                </span>
              </button>
            </li>
          ))}
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
