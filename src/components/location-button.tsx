"use client";

import { MapPin, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { City } from "@/db/schema";
import { useEffect } from "react";

type Props = {
  cities: City[];
  onCityFound: (city: City) => void;
};

export function LocationButton({ cities, onCityFound }: Props) {
  const { latitude, longitude, error, loading, requestLocation } = useGeolocation();

  useEffect(() => {
    if (latitude && longitude && cities.length > 0) {
      const nearestCity = findNearestCity(latitude, longitude, cities);
      if (nearestCity) {
        onCityFound(nearestCity);
      }
    }
  }, [latitude, longitude, cities, onCityFound]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={requestLocation}
        disabled={loading}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 shadow-lg backdrop-blur-[3px] transition-all hover:bg-white/80 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        title="Use my location"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          <MapPin className="h-5 w-5 text-gray-700" />
        )}
      </button>
      {error && (
        <div className="absolute top-16 rounded-2xl border border-red-200/50 bg-red-50/80 px-3 py-2 text-xs text-red-700 shadow-lg backdrop-blur-[3px]">
          {error}
        </div>
      )}
    </div>
  );
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
