"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { motion, useDragControls, PanInfo } from "framer-motion";
import dynamic from "next/dynamic";
import { City, Review } from "@/db/schema";
import { SearchBar } from "@/components/search-bar";
import { CityPanel } from "@/components/city-panel";
import { Logo } from "@/components/logo";
import { MapTilePreload } from "@/components/map-preload";

const Map = dynamic(() => import("@/components/map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-gray-700 font-medium">Loading map...</div>
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
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [customLocation, setCustomLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [shouldFlyToCity, setShouldFlyToCity] = useState(true);
  const dragControls = useDragControls();

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isDrawerExpanded) {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        setIsDrawerExpanded(false);
      }
    } else {
      if (info.offset.y < -100 || info.velocity.y < -500) {
        setIsDrawerExpanded(true);
      }
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

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setIsDrawerExpanded(false); // Start collapsed on mobile
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

    console.log("Pin clicked at:", customLocation);

    try {
      // Try to geocode the location using Google Maps
      const response = await fetch(
        `/api/geocode?lat=${customLocation.lat}&lng=${customLocation.lng}`
      );

      console.log("Geocode response status:", response.status);

      if (response.ok) {
        const geocodedData = await response.json();
        console.log("Geocoded data:", geocodedData);

        // Check if we have this city in our database
        const existingCity = cities.find(
          (city) =>
            city.name === geocodedData.name &&
            city.country === geocodedData.country
        );

        if (existingCity) {
          // Use existing city from database
          console.log("Found existing city:", existingCity.name);
          setShouldFlyToCity(false);
          setSelectedCity(existingCity);
          setIsDrawerExpanded(true);
        } else {
          // Create a temporary city object for the new location
          console.log("Creating new city:", geocodedData.name);
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
          setIsDrawerExpanded(true);
        }
      } else {
        const errorData = await response.json();
        console.error("Geocoding failed:", errorData);
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
        setIsDrawerExpanded(true);
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
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
      setIsDrawerExpanded(true);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Preload map tiles for LCP optimization */}
      <MapTilePreload />

      {/* Logo - Bottom Left */}
      <div className="absolute left-4 bottom-4 z-10 rounded-2xl bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm">
        <Logo />
      </div>

      {/* Search Bar - Floating */}
      <div
        className={`
        absolute left-1/2 z-10 flex w-full -translate-x-1/2 flex-row items-center gap-3 px-4
        transition-all duration-300 ease-out
        ${selectedCity && !searchExpanded ? "max-w-[120px]" : "max-w-xl"}
        ${isDrawerExpanded ? "top-4" : "top-6"}
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

      {/* City Panel Drawer - Responsive */}
      {selectedCity && (
        <>
          {/* Mobile: Bottom Sheet */}
          <motion.div
            className={`
              md:hidden absolute left-0 right-0 z-20 
              bottom-0
            `}
            style={{ height: "calc(100vh - 80px)" }}
            initial="collapsed"
            animate={isDrawerExpanded ? "expanded" : "collapsed"}
            variants={{
              expanded: { y: 0 },
              collapsed: { y: "calc(100% - 160px)" },
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <div className="relative h-full">
              {/* Drag Handle & Click Area - Expanded to make it easier to grab */}
              <div
                className="absolute left-0 right-0 top-0 h-16 z-30 touch-none flex items-start justify-center pt-3"
                onPointerDown={(e) => dragControls.start(e)}
                onClick={() => !isDrawerExpanded && setIsDrawerExpanded(true)}
              >
                <div className="h-1.5 w-12 rounded-full bg-gray-400/60" />
              </div>

              <div className="h-full overflow-hidden rounded-t-4xl border-t border-white/20 bg-white/60 shadow-2xl backdrop-blur-2xl">
                <div
                  className={`h-full overflow-y-auto ${
                    isDrawerExpanded ? "pt-2" : "pt-0"
                  }`}
                >
                  <CityPanel
                    city={city}
                    reviews={reviews}
                    onReviewSubmit={handleReviewSubmit}
                    onClose={() => {
                      setSelectedCity(null);
                      setIsDrawerExpanded(false);
                      setCustomLocation(null);
                    }}
                    isMobile={true}
                    isExpanded={isDrawerExpanded}
                    customLocation={customLocation}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Desktop: Side Panel */}
          <div
            className={`
            hidden md:block absolute bottom-4 top-4 z-20 w-full max-w-md overflow-hidden rounded-4xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-2xl lg:w-96
            transition-all duration-300 ease-out
            ${
              searchExpanded
                ? "md:-right-6 lg:-right-8"
                : "md:right-4 lg:right-4"
            }
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
        </>
      )}
    </div>
  );
}
