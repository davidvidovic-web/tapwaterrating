"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { City, Review } from "@/db/schema";
import { Droplet } from "lucide-react";
import L from "leaflet";
import { renderToString } from "react-dom/server";

type Props = {
  cities: City[];
  reviews?: Review[];
  onSelect?: (city: City) => void;
  onReviewSelect?: (review: Review) => void;
  selectedCity?: City | null;
  selectedReviewId?: string | null;
  onMapClick?: (lat: number, lng: number) => void;
  customLocation?: { lat: number; lng: number } | null;
  onPinClick?: () => void;
  shouldFlyToCity?: boolean;
  nearestCity?: City | null;
};

export type MapHandle = {
  flyToCity: (city: City) => void;
};

// Component to handle map flying
function MapController({ selectedCity, shouldFly }: { selectedCity?: City | null; shouldFly?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCity && shouldFly) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      
      // Calculate distance between current center and new location (in degrees)
      const distance = Math.sqrt(
        Math.pow(currentCenter.lat - selectedCity.latitude, 2) +
        Math.pow(currentCenter.lng - selectedCity.longitude, 2)
      );
      
      // Determine zoom level based on distance
      // For search results, zoom in very close (16-17 for street-level view)
      let targetZoom: number;
      if (distance < 0.01) {
        // Very close (< ~1km): zoom to street level
        targetZoom = 17;
      } else if (distance < 0.1) {
        // Close (< ~11km): zoom to neighborhood level
        targetZoom = 15;
      } else if (distance < 1) {
        // Medium close (< ~111km): zoom to city level
        targetZoom = 13;
      } else if (distance < 5) {
        // Medium distance (< ~555km): zoom to 10
        targetZoom = 10;
      } else if (distance < 20) {
        // Far (< ~2220km): zoom to 8
        targetZoom = 8;
      } else {
        // Very far: zoom to 6
        targetZoom = 6;
      }
      
      map.flyTo([selectedCity.latitude, selectedCity.longitude], targetZoom, {
        duration: 2,
      });
    }
  }, [selectedCity, shouldFly, map]);

  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onMapClick) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

// Component to handle ref
function MapRefHandler({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
}

// Component to track zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    // Set initial zoom
    onZoomChange(map.getZoom());

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// Helper to get color based on safety rating
function getSafetyColor(rating: number): string {
  if (rating >= 4.5) return "#2563eb"; // blue-600
  if (rating >= 3.5) return "#0ea5e9"; // sky-500
  if (rating >= 2.5) return "#eab308"; // yellow-500
  if (rating >= 1.5) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

export const Map = forwardRef<MapHandle, Props>(({ cities, reviews = [], onSelect, onReviewSelect, selectedCity, selectedReviewId, onMapClick, customLocation, onPinClick, shouldFlyToCity = true, nearestCity }, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState(3);

  // Only show reviews when zoomed in past threshold
  const REVIEW_ZOOM_THRESHOLD = 8;
  const shouldShowReviews = zoomLevel >= REVIEW_ZOOM_THRESHOLD;

  // Filter cities based on zoom level to prevent overcrowding
  // When zoomed out, only show major cities. As we zoom in, show more detail
  const getVisibleCities = () => {
    // Filter cities that have reviews either by cityId OR by geographic proximity
    const citiesWithReviews = cities.filter((city) => {
      // Check if any reviews are directly assigned to this city
      const hasDirectReviews = reviews && reviews.some((review) => review.cityId === city.id);
      
      // Also check if any reviews are geographically near this city (within ~10km)
      const hasNearbyReviews = reviews && reviews.some((review) => {
        const distance = Math.sqrt(
          Math.pow(city.latitude - review.latitude, 2) + 
          Math.pow(city.longitude - review.longitude, 2)
        );
        // Roughly 0.1 degrees ≈ 10 kilometers
        return distance < 0.1;
      });
      
      return hasDirectReviews || hasNearbyReviews;
    });

    // When zoomed in enough to see individual reviews, show all city aggregates
    if (shouldShowReviews) {
      return citiesWithReviews;
    }

    // Sort by review count (most reviews = most important)
    const sortedCities = [...citiesWithReviews].sort((a, b) => {
      const aCount = a.reviewCount || reviews.filter(r => r.cityId === a.id).length;
      const bCount = b.reviewCount || reviews.filter(r => r.cityId === b.id).length;
      return bCount - aCount;
    });

    // Calculate distance threshold based on zoom level
    // At low zoom, markers need to be far apart. At high zoom, they can be close
    const getDistanceThreshold = (zoom: number) => {
      if (zoom < 5) return 3.0;   // Very far apart (country level)
      if (zoom < 7) return 1.5;   // Far apart (region level)
      return 0.5;                 // Medium distance (state/province level)
    };

    const distanceThreshold = getDistanceThreshold(zoomLevel);
    const visibleCities: City[] = [];
    
    // Always include selected city
    if (selectedCity && citiesWithReviews.find(c => c.id === selectedCity.id)) {
      visibleCities.push(selectedCity);
    }

    // Add cities that are far enough from already visible cities
    for (const city of sortedCities) {
      if (visibleCities.find(c => c.id === city.id)) continue; // Skip if already added
      
      // Check if this city is far enough from all visible cities
      const isFarEnough = visibleCities.every(visibleCity => {
        const distance = Math.sqrt(
          Math.pow(city.latitude - visibleCity.latitude, 2) + 
          Math.pow(city.longitude - visibleCity.longitude, 2)
        );
        return distance >= distanceThreshold;
      });

      if (isFarEnough) {
        visibleCities.push(city);
      }
    }

    return visibleCities;
  };

  const visibleCities = getVisibleCities();

  useImperativeHandle(ref, () => ({
    flyToCity: (city: City) => {
      if (mapRef.current) {
        mapRef.current.flyTo([city.latitude, city.longitude], 12, {
          duration: 2,
        });
      }
    },
  }));

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };

  // Create custom icon for city markers (aggregate of all reviews in area)
  const createCustomIcon = useCallback((isSelected: boolean, safetyRating: number, reviewCount: number) => {
    const color = getSafetyColor(safetyRating);
    const size = isSelected ? 56 : 48;
    const badgeSize = isSelected ? 28 : 24;
    const fontSize = isSelected ? 14 : 12;
    
    // Tap icon with aggregate score badge
    const tapIcon = `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <img src="/tap.png" alt="Tap" style="width: 100%; height: 100%; object-fit: contain;" />
        <div style="position: absolute; top: -${badgeSize/4}px; right: -${badgeSize/4}px; width: ${badgeSize}px; height: ${badgeSize}px; background-color: ${color}; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${fontSize}px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${reviewCount}
        </div>
      </div>
    `;

    return L.divIcon({
      html: tapIcon,
      className: isSelected
        ? "drop-shadow-lg"
        : "drop-shadow-md hover:drop-shadow-lg transition-shadow cursor-pointer",
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  }, []);

  // Create custom pin icon with glass and plus icon for new reviews
  const pinIcon = useMemo(() => {
    const iconHtml = `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <img src="/glass.png" alt="Glass" style="width: 100%; height: 100%; object-fit: contain;" />
        <div style="position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2V10M2 6H10" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "drop-shadow-lg cursor-pointer",
      iconSize: [40, 40],
      iconAnchor: [20, 45], // Centered horizontally, 5px above marker point
    });
  }, []);

  // Create review pin icon - smaller droplet
  const createReviewIcon = useCallback((safetyRating: number, isSelected: boolean = false) => {
    const color = getSafetyColor(safetyRating);
    const size = isSelected ? 44 : 32;
    const dotSize = isSelected ? 14 : 10;
    const borderWidth = isSelected ? 2 : 1.5;
    
    const iconHtml = `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <img src="/glass.png" alt="Water" style="width: 100%; height: 100%; object-fit: contain;" />
        <div style="position: absolute; bottom: ${isSelected ? 3 : 2}px; left: 50%; transform: translateX(-50%); width: ${dotSize}px; height: ${dotSize}px; background-color: ${color}; border-radius: 50%; border: ${borderWidth}px solid white;"></div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: isSelected 
        ? "drop-shadow-lg cursor-pointer" 
        : "drop-shadow-md cursor-pointer hover:drop-shadow-lg transition-shadow",
      iconSize: [size, size],
      iconAnchor: [size / 2, size - 5], // Centered horizontally, 5px above the marker point
    });
  }, []);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      style={{ height: "100%", width: "100%" }}
      whenReady={() => {
        // Map is ready
      }}
    >
      <MapRefHandler onMapReady={handleMapReady} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        minZoom={2}
        keepBuffer={2}
        updateWhenIdle={false}
        updateWhenZooming={false}
      />
      <MapController selectedCity={selectedCity} shouldFly={shouldFlyToCity} />
      <MapClickHandler onMapClick={onMapClick} />
      <ZoomTracker onZoomChange={setZoomLevel} />
      
      {/* City markers - aggregate of all reviews in area */}
      {/* Filtered by zoom level to show only major cities when zoomed out */}
      {visibleCities.map((city) => {
          const isSelected = selectedCity?.id === city.id;
          const safetyRating = (city.avgSafetyRating ?? 0) > 0 ? (city.avgSafetyRating ?? 0) : city.safetyRating / 2;
          
          // Use the review count from the database (only counts published reviews)
          const reviewCount = city.reviewCount || 0;
          
          return (
            <Marker
              key={city.id}
              position={[city.latitude, city.longitude]}
              icon={createCustomIcon(isSelected, safetyRating, reviewCount)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  onSelect?.(city);
                },
              }}
            />
          );
        })}
      
      {/* Review location markers - only show when zoomed in */}
      {shouldShowReviews && reviews.map((review) => {
        // Check if this review is selected by comparing review ID
        const isSelected = selectedReviewId === review.id;
        
        return (
          <Marker
            key={review.id}
            position={[review.latitude, review.longitude]}
            icon={createReviewIcon(review.safetyRating, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
              click: () => {
                onReviewSelect?.(review);
              },
            }}
          />
        );
      })}
      
      {/* Custom location pin */}
      {customLocation && (
        <Marker
          position={[customLocation.lat, customLocation.lng]}
          icon={pinIcon}
          eventHandlers={{
            click: () => {
              onPinClick?.();
            },
          }}
        />
      )}
    </MapContainer>
  );
});

Map.displayName = "Map";
