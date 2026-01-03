"use client";

import useSWR from "swr";
import { useMemo, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { City, Review } from "@/db/schema";
import { SearchBar } from "@/components/search-bar";
import { CityPanel } from "@/components/city-panel";
import { Logo } from "@/components/logo";
import { MapTilePreload } from "@/components/map-preload";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { Droplets } from "lucide-react";

const Map = dynamic(() => import("@/components/map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="flex flex-col items-center gap-10">
        {/* Animated water waves */}
        <div className="relative">
          {/* Background circles creating ripple effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-blue-400/20 animate-ping" style={{ animationDuration: "2s" }}></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }}></div>
          </div>
          
          {/* Center droplets icon */}
          <div className="relative z-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-5 shadow-lg">
            <Droplets className="h-10 w-10 text-white animate-pulse" />
          </div>
        </div>
        
        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-bold text-gray-800">Loading Map</span>
          <span className="text-sm text-gray-600">Preparing water quality data</span>
        </div>
      </div>
    </div>
  ),
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export default function Home() {
  const { data: cityList, mutate: mutateCityList } = useSWR<City[]>(
    "/api/cities?limit=100",
    fetcher
  );
  const { data: allReviews, mutate: mutateAllReviews } = useSWR<Review[]>(
    "/api/reviews?showAll=true",
    fetcher
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [customLocation, setCustomLocation] = useState<{
    lat: number;
    lng: number;
    streetAddress?: string;
    neighborhood?: string;
  } | null>(null);
  const [shouldFlyToCity, setShouldFlyToCity] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const { data: cityDetails, mutate: mutateCityDetails } = useSWR<{
    city: City;
    reviews: Review[];
  }>(
    // Don't fetch details for temporary cities (ID "-1")
    selectedCity && selectedCity.id !== "-1"
      ? `/api/cities/${selectedCity.id}`
      : null,
    fetcher
  );

  const cities = cityList ?? [];
  const reviewsOnMap = allReviews ?? [];
  const reviews = cityDetails?.reviews ?? [];
  const city = useMemo(
    () => cityDetails?.city ?? selectedCity,
    [cityDetails, selectedCity]
  );

  // Refs for layout manager
  const logoRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  // Layout manager: all UI elements push each other, not the map
  const layoutStyles = useLayoutManager({
    elements: [
      {
        ref: logoRef,
        priority: 8, // High priority - logo stays in place
        anchorTo: "bottom",
        canMove: false,
      },
      {
        ref: searchBarRef,
        priority: 10, // Medium priority - below panels/drawers
        anchorTo: "top",
        canMove: false,
      },
      {
        ref: desktopPanelRef,
        priority: 12, // High priority - sidebar above search
        visible: !!selectedCity,
        anchorTo: "right",
      },
    ],
    gap: 16,
    dependencies: [selectedCity, searchExpanded],
  });

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
    setShouldFlyToCity(true); // Enable flying when selecting from city markers
    setCustomLocation(null); // Clear any custom location
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // Set the pin location and fetch address info
    setCustomLocation({ lat, lng });
    setSelectedCity(null); // Clear any selected city
    
    // Fetch address info in background
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        setCustomLocation({
          lat,
          lng,
          streetAddress: data.streetAddress,
          neighborhood: data.neighborhood,
        });
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
    }
  }, []);

  const handlePinClick = useCallback(async (lat?: number, lng?: number) => {
    // When pin is clicked, geocode the location and open review form
    // Use provided coordinates or fall back to customLocation state
    const coords = (lat !== undefined && lng !== undefined) 
      ? { lat, lng } 
      : customLocation;
    
    if (!coords) return;

    try {
      // Try to geocode the location using Google Maps (if we don't already have address info)
      let geocodedData;
      if (customLocation?.streetAddress) {
        // We already have the address info from handleMapClick
        geocodedData = {
          name: "",
          country: "",
          countryCode: "XX",
          streetAddress: customLocation.streetAddress,
          neighborhood: customLocation.neighborhood,
        };
      }
      
      const response = await fetch(
        `/api/geocode?lat=${coords.lat}&lng=${coords.lng}`
      );

      if (!response.ok) {
        console.error('Geocoding API error:', response.status, response.statusText);
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const newGeocodedData = await response.json();
      
      // Merge with existing address data if we had it
      geocodedData = geocodedData ? {
        ...newGeocodedData,
        streetAddress: geocodedData.streetAddress || newGeocodedData.streetAddress,
        neighborhood: geocodedData.neighborhood || newGeocodedData.neighborhood,
      } : newGeocodedData;

      // Update customLocation with full address info
      setCustomLocation({
        lat: coords.lat,
        lng: coords.lng,
        streetAddress: geocodedData.streetAddress,
        neighborhood: geocodedData.neighborhood,
      });

      // Check if we have this city in our database
      const existingCity = cities.find(
        (city) =>
          city.name === geocodedData.name &&
          city.country === geocodedData.country
      );

      if (existingCity) {
        // Use existing city from database but with the exact clicked location
        setShouldFlyToCity(false);
        setSelectedCity({
          ...existingCity,
          latitude: coords.lat,
          longitude: coords.lng,
        });
      } else {
        // Create a temporary city object with the exact clicked location
        const tempCity: City = {
          id: "-1", // Temporary ID for new cities
          name: geocodedData.name,
          country: geocodedData.country,
          countryCode: geocodedData.countryCode || "XX",
          latitude: coords.lat,
          longitude: coords.lng,
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

        setShouldFlyToCity(false);
        setSelectedCity(tempCity);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // If error occurs, still use the exact clicked location
      const tempCity: City = {
        id: "-1",
        name: "Unknown Location",
        country: "Unknown",
        countryCode: "XX",
        latitude: coords.lat,
        longitude: coords.lng,
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

      setShouldFlyToCity(false);
      setSelectedCity(tempCity);
    }
  }, [cities]);

  const handleGeolocation = useCallback((lat: number, lng: number) => {
    // For geolocation, find the nearest city and show its info (no pin)
    if (cities.length > 0) {
      const nearestCity = findNearestCity(lat, lng, cities);
      if (nearestCity) {
        setShouldFlyToCity(true);
        setSelectedCity(nearestCity);
        setCustomLocation(null); // No pin for geolocation
      }
    }
  }, [cities]);

  const handleReviewSubmit = useCallback(async () => {
    // Refresh city details, city list, and all reviews to show new review and updated markers
    await Promise.all([mutateCityDetails(), mutateCityList(), mutateAllReviews()]);
  }, [mutateCityDetails, mutateCityList, mutateAllReviews]);

  const handleReviewSelect = useCallback((review: Review) => {
    // Find the city for this review
    const city = cities.find(c => c.id === review.cityId);
    if (city) {
      // Don't set customLocation - we're viewing an existing review, not creating a new one
      setCustomLocation(null);
      // Set the selected review ID to highlight it
      setSelectedReviewId(review.id);
      // Create a temporary city at the review location to fly the map there
      setSelectedCity({
        ...city,
        latitude: review.latitude,
        longitude: review.longitude,
      });
      setShouldFlyToCity(true);
    }
  }, [cities]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Preload map tiles for LCP optimization */}
      <MapTilePreload />

      {/* Logo - Bottom Left */}
      <div 
        ref={logoRef}
        style={layoutStyles.get(logoRef)}
        className="absolute left-4 bottom-4 rounded-full border border-white/40 bg-white/60 px-4 py-2 shadow-lg backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-xl"
      >
        <Logo />
      </div>

      {/* Search Bar - Floating */}
      <div
        ref={searchBarRef}
        style={layoutStyles.get(searchBarRef)}
        className={`
        absolute left-1/2 flex w-full -translate-x-1/2 flex-row items-center gap-3 px-4 top-6
        transition-all duration-300 ease-out
        ${selectedCity && !searchExpanded ? "max-w-[120px]" : "max-w-xl"}
      `}
      >
        <div className="flex-1">
          <SearchBar
            cities={cities}
            onSelect={handleCitySelect}
            onGeolocation={handleGeolocation}
            collapsed={!!selectedCity}
            onExpandChange={setSearchExpanded}
          />
        </div>
      </div>

      {/* Map - Full Screen */}
      <div className="absolute inset-0 z-0">
        <Map
          cities={cities}
          reviews={reviewsOnMap}
          onSelect={handleCitySelect}
          onReviewSelect={handleReviewSelect}
          selectedCity={selectedCity}
          selectedReviewId={selectedReviewId}
          onMapClick={handleMapClick}
          customLocation={customLocation}
          onPinClick={() => customLocation && handlePinClick(customLocation.lat, customLocation.lng)}
          shouldFlyToCity={shouldFlyToCity}
        />
      </div>

      {/* City Panel - Unified for all screen sizes */}
      {selectedCity && (
        <div
          ref={desktopPanelRef}
          style={layoutStyles.get(desktopPanelRef)}
          className={`
            absolute overflow-hidden rounded-4xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-2xl
            transition-all duration-300 ease-out
            
            left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md lg:w-96
            bottom-4 top-4
            
            md:left-auto md:translate-x-0 md:right-4
          `}
        >
          <div className="h-full overflow-y-auto">
            <CityPanel
              city={city}
              reviews={reviews}
              onReviewSubmit={handleReviewSubmit}
              onClose={() => {
                setSelectedCity(null);
                setCustomLocation(null);
                setSelectedReviewId(null);
              }}
              isMobile={false}
              isExpanded={true}
              customLocation={customLocation}
              selectedReviewId={selectedReviewId}
              onReviewClick={handleReviewSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
