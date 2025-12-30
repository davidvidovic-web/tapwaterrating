"use client";

import useSWR from "swr";
import { useMemo, useState, useRef } from "react";
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

// Haversine distance formula to find nearest city
function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home() {
  const { data: cityList, mutate: mutateCityList } = useSWR<City[]>(
    "/api/cities?limit=100",
    fetcher
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [customLocation, setCustomLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [shouldFlyToCity, setShouldFlyToCity] = useState(true);

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

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setShouldFlyToCity(true); // Enable flying when selecting from city markers
    setCustomLocation(null); // Clear any custom location
  };

  const handleReviewSubmit = async () => {
    // Refresh both city details and city list to show new review and updated markers
    await Promise.all([mutateCityDetails(), mutateCityList()]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Just set the pin location, don't open panel yet
    setCustomLocation({ lat, lng });
    setSelectedCity(null); // Clear any selected city
  };

  const handlePinClick = async () => {
    // When pin is clicked, geocode the location and open review form
    if (!customLocation) return;

    try {
      // Try to geocode the location using Google Maps
      const response = await fetch(
        `/api/geocode?lat=${customLocation.lat}&lng=${customLocation.lng}`
      );

      if (response.ok) {
        const geocodedData = await response.json();

        // Check if we have this city in our database
        const existingCity = cities.find(
          (city) =>
            city.name === geocodedData.name &&
            city.country === geocodedData.country
        );

        if (existingCity) {
          // Use existing city from database
          setShouldFlyToCity(false);
          setSelectedCity(existingCity);
        } else {
          // Create a temporary city object for the new location
          const tempCity: City = {
            id: "-1", // Temporary ID for new cities
            name: geocodedData.name,
            country: geocodedData.country,
            countryCode: geocodedData.countryCode || "XX",
            latitude: geocodedData.latitude,
            longitude: geocodedData.longitude,
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
      } else {
        // Fallback to nearest city if geocoding fails
        if (cities.length === 0) return;

        let nearestCity = cities[0];
        let minDistance = getDistance(
          customLocation.lat,
          customLocation.lng,
          cities[0].latitude,
          cities[0].longitude
        );

        for (const city of cities) {
          const distance = getDistance(
            customLocation.lat,
            customLocation.lng,
            city.latitude,
            city.longitude
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
          }
        }

        setShouldFlyToCity(false);
        setSelectedCity(nearestCity);
      }
    } catch (error) {
      // Fallback to nearest city
      if (cities.length === 0) return;

      let nearestCity = cities[0];
      let minDistance = getDistance(
        customLocation.lat,
        customLocation.lng,
        cities[0].latitude,
        cities[0].longitude
      );

      for (const city of cities) {
        const distance = getDistance(
          customLocation.lat,
          customLocation.lng,
          city.latitude,
          city.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      }

      setShouldFlyToCity(false);
      setSelectedCity(nearestCity);
    }
  };

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
  const reviews = cityDetails?.reviews ?? [];
  const city = useMemo(
    () => cityDetails?.city ?? selectedCity,
    [cityDetails, selectedCity]
  );

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
            collapsed={!!selectedCity}
            onExpandChange={setSearchExpanded}
          />
        </div>
      </div>

      {/* Map - Full Screen */}
      <div className="absolute inset-0 z-0">
        <Map
          cities={cities}
          onSelect={handleCitySelect}
          selectedCity={selectedCity}
          onMapClick={handleMapClick}
          customLocation={customLocation}
          onPinClick={handlePinClick}
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
              }}
              isMobile={false}
              isExpanded={true}
              customLocation={customLocation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
