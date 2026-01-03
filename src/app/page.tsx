"use client";

import useSWR from "swr";
import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { City, Review } from "@/db/schema";
import { SearchBar } from "@/components/search-bar";
import { CityPanel } from "@/components/city-panel";
import { Logo } from "@/components/logo";
import { MapTilePreload } from "@/components/map-preload";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MapLoadingScreen = () => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 90);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (typeof document === 'undefined') return null;

  const loadingContent = (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100" style={{ zIndex: 9999999 }}>
        <div className="flex flex-col items-center gap-10">
          {/* Animated water waves */}
          <div className="relative">
            {/* Background circles creating ripple effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-20 w-20 rounded-full bg-blue-400/20 animate-ping"
                style={{ animationDuration: "2s" }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-16 w-16 rounded-full bg-blue-500/20 animate-ping"
                style={{ animationDuration: "2s", animationDelay: "0.5s" }}
              ></div>
            </div>

            {/* Center droplets icon */}
            <div className="relative z-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-5 shadow-lg">
              <Droplets className="h-10 w-10 text-white animate-pulse" />
            </div>
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center gap-4 w-64">
            <span className="text-xl font-bold text-gray-800">Loading Map</span>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">
                  Preparing water quality data...
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  return createPortal(loadingContent, document.body);
};

const MapComponent = dynamic(() => import("@/components/map").then((mod) => mod.Map), {
  ssr: false,
  loading: MapLoadingScreen,
});

const Map = (props: any) => {
  const { onMapLoaded, ...otherProps } = props;
  const mapRef = React.useRef<any>(null);
  
  React.useEffect(() => {
    // Only call onMapLoaded after a short delay to ensure MapComponent has rendered
    const timer = setTimeout(() => {
      if (onMapLoaded) {
        onMapLoaded();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [onMapLoaded]);
  
  return <MapComponent ref={mapRef} {...otherProps} />;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Haversine formula to calculate distance between two coordinates
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function findNearestCity(
  lat: number,
  lon: number,
  cities: City[]
): City | null {
  if (cities.length === 0) return null;

  let nearestCity = cities[0];
  let minDistance = getDistance(
    lat,
    lon,
    nearestCity.latitude,
    nearestCity.longitude
  );

  for (let i = 1; i < cities.length; i++) {
    const distance = getDistance(
      lat,
      lon,
      cities[i].latitude,
      cities[i].longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = cities[i];
    }
  }

  return nearestCity;
}

export default function Home() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [drawerFullScreen, setDrawerFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<{
    y: number;
    time: number;
  } | null>(null);
  const [drawerScrolled, setDrawerScrolled] = useState(false);
  const drawerHandleRef = useRef<HTMLDivElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  // Mobile drawer heights
  const DRAWER_COLLAPSED_HEIGHT = "30vh"; // 30% of screen
  const DRAWER_EXPANDED_HEIGHT = "90vh"; // 90% of screen
  const DRAWER_FULLSCREEN_HEIGHT = "100vh"; // Full screen
  const MAP_COLLAPSED_HEIGHT = "70vh"; // 70% of screen when drawer is collapsed
  const MAP_EXPANDED_HEIGHT = "8vh"; // 8% of screen when drawer is expanded (reduced to eliminate gap)
  const MAP_FULLSCREEN_HEIGHT = "0vh"; // Hidden when drawer is full screen

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Drawer interaction handlers (native events)
  const handleDrawerTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ y: touch.clientY, time: Date.now() });
    // Prevent pull-to-refresh when interacting with drawer handle
    e.preventDefault();
  }, []);

  const handleDrawerTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaY = touchStart.y - touch.clientY;
      const deltaTime = Date.now() - touchStart.time;
      const velocity = Math.abs(deltaY) / deltaTime;

      // Swipe up to expand, down to collapse
      if (Math.abs(deltaY) > 50 || velocity > 0.5) {
        if (deltaY > 0) {
          // Swipe up - expand
          if (!drawerExpanded) {
            setDrawerExpanded(true);
          }
        } else {
          // Swipe down - collapse
          if (drawerExpanded) {
            setDrawerExpanded(false);
          }
        }
      }

      setTouchStart(null);
    },
    [touchStart, drawerExpanded]
  );

  // Content area touch handlers (native events)
  const handleContentTouchMove = useCallback((e: TouchEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    const isAtTop = target.scrollTop === 0;

    if (isAtTop) {
      const touch = e.touches[0];
      const initialY = parseFloat(target.dataset.initialTouchY || "0");
      const deltaY = touch.clientY - initialY;

      // If swiping down (positive deltaY) when at top, prevent pull-to-refresh
      if (deltaY > 0) {
        e.preventDefault();
      }
    }
  }, []);

  const handleContentTouchStart = useCallback((e: TouchEvent) => {
    // Only handle if scrolled to top and swiping down
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLDivElement;
    const isAtTop = target.scrollTop === 0;

    if (isAtTop) {
      setTouchStart({ y: touch.clientY, time: Date.now() });
    }

    // Prevent pull-to-refresh when at top of drawer content
    if (isAtTop) {
      const touchY = touch.clientY;
      // Store initial touch for comparison in touchmove
      (e.currentTarget as HTMLDivElement).dataset.initialTouchY =
        touchY.toString();
    }
  }, []);

  const handleContentTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaY = touchStart.y - touch.clientY;
      const deltaTime = Date.now() - touchStart.time;
      const velocity = Math.abs(deltaY) / deltaTime;
      const target = e.currentTarget as HTMLDivElement;
      const isAtTop = target.scrollTop === 0;

      // Only handle swipe down gestures when at top
      if ((Math.abs(deltaY) > 50 || velocity > 0.5) && isAtTop) {
        if (deltaY < 0) {
          // Swipe down - collapse
          e.preventDefault();
          if (drawerExpanded) {
            setDrawerExpanded(false);
          }
        } else if (deltaY > 0) {
          // Swipe up - expand
          if (!drawerExpanded) {
            setDrawerExpanded(true);
          }
        }
      }

      setTouchStart(null);
    },
    [touchStart, drawerExpanded]
  );

  // Attach native touch event listeners with { passive: false }
  useEffect(() => {
    const drawerHandle = drawerHandleRef.current;
    const drawerContent = drawerContentRef.current;

    if (drawerHandle) {
      drawerHandle.addEventListener("touchstart", handleDrawerTouchStart, {
        passive: false,
      });
      drawerHandle.addEventListener("touchend", handleDrawerTouchEnd, {
        passive: false,
      });
    }

    if (drawerContent) {
      drawerContent.addEventListener("touchstart", handleContentTouchStart, {
        passive: false,
      });
      drawerContent.addEventListener("touchmove", handleContentTouchMove, {
        passive: false,
      });
      drawerContent.addEventListener("touchend", handleContentTouchEnd, {
        passive: false,
      });
    }

    return () => {
      if (drawerHandle) {
        drawerHandle.removeEventListener("touchstart", handleDrawerTouchStart);
        drawerHandle.removeEventListener("touchend", handleDrawerTouchEnd);
      }
      if (drawerContent) {
        drawerContent.removeEventListener(
          "touchstart",
          handleContentTouchStart
        );
        drawerContent.removeEventListener("touchmove", handleContentTouchMove);
        drawerContent.removeEventListener("touchend", handleContentTouchEnd);
      }
    };
  }, [
    handleDrawerTouchStart,
    handleDrawerTouchEnd,
    handleContentTouchStart,
    handleContentTouchMove,
    handleContentTouchEnd,
  ]);

  const handleDrawerWheel = (e: React.WheelEvent) => {
    // Prevent default scroll behavior on the drawer handle
    e.preventDefault();

    // Scroll up to expand, down to collapse
    if (e.deltaY < -10) {
      // Scroll up - expand
      if (!drawerExpanded) {
        setDrawerExpanded(true);
      }
    } else if (e.deltaY > 10) {
      // Scroll down - collapse
      if (drawerExpanded) {
        setDrawerExpanded(false);
      }
    }
  };

  const toggleDrawer = () => {
    setDrawerExpanded(!drawerExpanded);
  };

  // Handle drawer content scroll
  const handleDrawerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollThreshold = 20; // Change handle after scrolling 20px
    setDrawerScrolled(target.scrollTop > scrollThreshold);
  };

  // Force map update after drawer state changes
  useEffect(() => {
    if (isMobile) {
      // Small delay to let animation complete, then trigger map resize
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 450); // Slightly after animation duration (400ms)

      return () => clearTimeout(timer);
    }
  }, [drawerExpanded, selectedCity, isMobile]);

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
    dependencies: [selectedCity],
  });

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
    setShouldFlyToCity(true); // Enable flying when selecting from city markers
    setCustomLocation(null); // Clear any custom location
    setDrawerExpanded(false); // Collapse drawer when new city is selected
    setDrawerScrolled(false); // Reset scroll state
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
      console.error("Failed to fetch address:", error);
    }
  }, []);

  const handlePinClick = useCallback(
    async (lat?: number, lng?: number) => {
      // When pin is clicked, geocode the location and open review form
      // Use provided coordinates or fall back to customLocation state
      const coords =
        lat !== undefined && lng !== undefined ? { lat, lng } : customLocation;

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
          console.error(
            "Geocoding API error:",
            response.status,
            response.statusText
          );
          throw new Error(`Geocoding failed: ${response.status}`);
        }

        const newGeocodedData = await response.json();

        // Merge with existing address data if we had it
        geocodedData = geocodedData
          ? {
              ...newGeocodedData,
              streetAddress:
                geocodedData.streetAddress || newGeocodedData.streetAddress,
              neighborhood:
                geocodedData.neighborhood || newGeocodedData.neighborhood,
            }
          : newGeocodedData;

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
        console.error("Geocoding error:", error);
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
    },
    [cities]
  );

  const handleGeolocation = useCallback(
    (lat: number, lng: number) => {
      // For geolocation, find the nearest city and show its info (no pin)
      if (cities.length > 0) {
        const nearestCity = findNearestCity(lat, lng, cities);
        if (nearestCity) {
          setShouldFlyToCity(true);
          setSelectedCity(nearestCity);
          setCustomLocation(null); // No pin for geolocation
        }
      }
    },
    [cities]
  );

  const handleReviewSubmit = useCallback(async () => {
    // Refresh city details, city list, and all reviews to show new review and updated markers
    await Promise.all([
      mutateCityDetails(),
      mutateCityList(),
      mutateAllReviews(),
    ]);
  }, [mutateCityDetails, mutateCityList, mutateAllReviews]);

  const handleReviewSelect = useCallback(
    (review: Review) => {
      // Find the city for this review
      const city = cities.find((c) => c.id === review.cityId);
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
    },
    [cities]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Global loading screen - shown until map loads */}
      {mounted && !mapLoaded && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100" style={{ zIndex: 9999999 }}>
          <div className="flex flex-col items-center gap-10">
            {/* Animated water waves */}
            <div className="relative">
              {/* Background circles creating ripple effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-20 w-20 rounded-full bg-blue-400/20 animate-ping"
                  style={{ animationDuration: "2s" }}
                ></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-16 w-16 rounded-full bg-blue-500/20 animate-ping"
                  style={{ animationDuration: "2s", animationDelay: "0.5s" }}
                ></div>
              </div>

              {/* Center droplets icon */}
              <div className="relative z-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-5 shadow-lg">
                <Droplets className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>

            {/* Loading text */}
            <div className="flex flex-col items-center gap-4 w-64">
              <span className="text-xl font-bold text-gray-800">Loading Map</span>
              <span className="text-sm text-gray-600">Preparing water quality data...</span>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Preload map tiles for LCP optimization */}
      <MapTilePreload />

      {/* Logo - Bottom Left - Hidden on mobile when drawer is open or during loading */}
      {mounted && mapLoaded && (!isMobile || !selectedCity) && cities && cities.length > 0 && (
        <div
          ref={logoRef}
          style={layoutStyles.get(logoRef)}
          className="absolute left-4 bottom-4 z-10 rounded-full border border-white/40 bg-white/60 px-4 py-2 shadow-lg backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-xl"
        >
          <Logo />
        </div>
      )}

      {/* Search Bar - Floating */}
      {mounted && mapLoaded && (
      <motion.div
        ref={searchBarRef}
        style={layoutStyles.get(searchBarRef)}
        className={`
        absolute left-1/2 flex w-full -translate-x-1/2 flex-row items-center gap-3 px-4 z-10
        transition-all duration-300 ease-out
        ${selectedCity && !searchExpanded ? "max-w-[120px]" : "max-w-xl"}
        ${drawerExpanded ? "-translate-y-1/2" : ""}
      `}
        animate={{
          top:
            selectedCity && isMobile && drawerExpanded
              ? "5vh" // Center in the small map area when drawer is expanded
              : "24px", // Normal top position for all other states
          y: 0,
          opacity: 1,
        }}
        transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
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
      </motion.div>
      )}

      {/* Map - Responsive to mobile drawer */}
      <motion.div
        className={
          selectedCity && isMobile
            ? "absolute top-0 left-0 right-0 z-0"
            : "absolute inset-0 z-0"
        }
        animate={{
          bottom:
            selectedCity && isMobile
              ? drawerExpanded
                ? DRAWER_EXPANDED_HEIGHT
                : DRAWER_COLLAPSED_HEIGHT
              : 0,
          y: 0,
        }}
        transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
      >
        <Map
          cities={cities}
          reviews={reviewsOnMap}
          onSelect={handleCitySelect}
          onReviewSelect={handleReviewSelect}
          selectedCity={selectedCity}
          selectedReviewId={selectedReviewId}
          onMapClick={handleMapClick}
          customLocation={customLocation}
          onPinClick={() =>
            customLocation &&
            handlePinClick(customLocation.lat, customLocation.lng)
          }
          shouldFlyToCity={shouldFlyToCity}
          onMapLoaded={() => setMapLoaded(true)}
        />
      </motion.div>

      {/* Mobile Drawer - Only on mobile */}
      <AnimatePresence>
        {selectedCity && isMobile && (
          <motion.div
            initial={{
              y: "100%",
              height: DRAWER_COLLAPSED_HEIGHT,
            }}
            animate={{
              height: drawerExpanded
                ? DRAWER_EXPANDED_HEIGHT
                : DRAWER_COLLAPSED_HEIGHT,
              y: 0,
            }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
            className="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-white shadow-2xl"
            style={{
              borderRadius: drawerExpanded
                ? "0.5rem 0.5rem 0 0"
                : "1.5rem 1.5rem 0 0",
              overscrollBehavior: "none",
              touchAction: "none",
            }}
          >
            {/* Drawer Handle */}
            <div
              ref={drawerHandleRef}
              className={`flex h-12 w-full cursor-pointer items-center justify-center flex-shrink-0 select-none transition-all duration-300 ${
                drawerScrolled
                  ? "bg-gray-50 border-b border-gray-200"
                  : "bg-white"
              }`}
              onClick={toggleDrawer}
              onWheel={handleDrawerWheel}
            >
              <div
                className={`h-1 w-10 rounded-sm pointer-events-none transition-all duration-300 ${
                  drawerScrolled ? "bg-blue-400 w-12" : "bg-gray-400"
                }`}
              ></div>
            </div>

            {/* Drawer Content */}
            <div
              ref={drawerContentRef}
              className={`flex-1 ${
                drawerExpanded ? "overflow-y-auto" : "overflow-y-hidden"
              }`}
              onScroll={handleDrawerScroll}
            >
              <CityPanel
                key={`mobile-${selectedCity?.id}-${reviews.length}-${
                  cityDetails?.city?.reviewCount || 0
                }`}
                city={city}
                reviews={reviews}
                onReviewSubmit={handleReviewSubmit}
                onClose={() => {
                  setSelectedCity(null);
                  setCustomLocation(null);
                  setSelectedReviewId(null);
                  setDrawerExpanded(false);
                }}
                isMobile={true}
                isExpanded={drawerExpanded}
                customLocation={customLocation}
                selectedReviewId={selectedReviewId}
                onReviewClick={handleReviewSelect}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop City Panel - Only on desktop */}
      {selectedCity && !isMobile && (
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
