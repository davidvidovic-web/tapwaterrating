"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { City } from "@/db/schema";
import { Droplet } from "lucide-react";
import L from "leaflet";
import { renderToString } from "react-dom/server";

type Props = {
  cities: City[];
  onSelect?: (city: City) => void;
  selectedCity?: City | null;
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
      map.flyTo([selectedCity.latitude, selectedCity.longitude], 12, {
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

export const Map = forwardRef<MapHandle, Props>(({ cities, onSelect, selectedCity, onMapClick, customLocation, onPinClick, shouldFlyToCity = true, nearestCity }, ref) => {
  const mapRef = useRef<L.Map | null>(null);

  useImperativeHandle(ref, () => ({
    flyToCity: (city: City) => {
      if (mapRef.current) {
        mapRef.current.flyTo([city.latitude, city.longitude], 12, {
          duration: 2,
        });
      }
    },
  }));

  // Create custom icon for city markers
  const createCustomIcon = (isSelected: boolean) => {
    const iconHtml = renderToString(
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '100%', width: '100%' }}>
        <Droplet
          className={isSelected ? "h-8 w-8 fill-blue-600 text-blue-600" : "h-6 w-6 fill-sky-600 text-sky-600"}
          strokeWidth={isSelected ? 2.5 : 2}
        />
      </div>
    );

    return L.divIcon({
      html: iconHtml,
      className: isSelected
        ? "drop-shadow-lg"
        : "drop-shadow-md hover:drop-shadow-lg transition-shadow cursor-pointer",
      iconSize: isSelected ? [32, 32] : [24, 24],
      iconAnchor: isSelected ? [16, 32] : [12, 24],
    });
  };

  // Create custom droplet icon with plus button
  const createPinIcon = () => {
    const iconHtml = renderToString(
      <div style={{ 
        position: 'relative',
        width: '40px',
        height: '48px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}>
        {/* Droplet shape - dripping down */}
        <svg 
          width="40" 
          height="48" 
          viewBox="0 0 40 48" 
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Droplet path - teardrop pointing down */}
          <path 
            d="M20 48 C 10 48, 4 40, 4 30 C 4 20, 20 0, 20 0 C 20 0, 36 20, 36 30 C 36 40, 30 48, 20 48 Z" 
            fill="#3b82f6" 
            stroke="#2563eb" 
            strokeWidth="2"
          />
          {/* Plus icon - white - centered in droplet */}
          <line x1="20" y1="20" x2="20" y2="34" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="13" y1="27" x2="27" y2="27" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );

    return L.divIcon({
      html: iconHtml,
      className: "drop-shadow-lg cursor-pointer",
      iconSize: [40, 48],
      iconAnchor: [20, 0], // Anchor at top so it drips down from cursor
    });
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        minZoom={2}
        keepBuffer={2}
        updateWhenIdle={false}
        updateWhenZooming={false}
      />
      <MapController selectedCity={selectedCity} shouldFly={shouldFlyToCity} />
      <MapClickHandler onMapClick={onMapClick} />
      
      {/* City markers */}
      {cities.map((city) => {
        const isSelected = selectedCity?.id === city.id;
        return (
          <Marker
            key={city.id}
            position={[city.latitude, city.longitude]}
            icon={createCustomIcon(isSelected)}
            eventHandlers={{
              click: () => {
                onSelect?.(city);
              },
            }}
          />
        );
      })}
      
      {/* Custom location pin */}
      {customLocation && (
        <Marker
          position={[customLocation.lat, customLocation.lng]}
          icon={createPinIcon()}
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
