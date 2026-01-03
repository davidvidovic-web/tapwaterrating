"use client";

import { City, Review } from "@/db/schema";
import {
  GlassWater,
  Star,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Beaker,
  Info,
  User,
  Edit3,
  X,
  ArrowLeft,
} from "lucide-react";
import { ReviewForm } from "./review-form";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";

type Props = {
  city?: City | null;
  reviews: Review[];
  onReviewSubmit?: () => void;
  onClose: () => void;
  isMobile?: boolean;
  isExpanded?: boolean;
  customLocation?: { lat: number; lng: number; streetAddress?: string; neighborhood?: string } | null;
  selectedReviewId?: string | null;
  onReviewClick?: (review: Review) => void;
};

export function CityPanel({ city, reviews, onReviewSubmit, onClose, isMobile = false, isExpanded = true, customLocation, selectedReviewId, onReviewClick }: Props) {
  // Auto-open review form if we have a custom location (user clicked on map)
  const [showReviewForm, setShowReviewForm] = useState(!!customLocation);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);
  const [reviewsContainerRef, setReviewsContainerRef] = useState<HTMLDivElement | null>(null);

  // Reset visible count when city or reviews change
  useEffect(() => {
    setVisibleReviewsCount(Math.max(5, reviews.length > 0 ? 5 : 0));
  }, [city?.id, reviews.length]);

  // When new reviews are added, ensure they're visible
  useEffect(() => {
    if (reviews.length > 0 && visibleReviewsCount === 0) {
      setVisibleReviewsCount(5);
    }
  }, [reviews, visibleReviewsCount]);

  // Infinite scroll handler
  useEffect(() => {
    if (!reviewsContainerRef) return;

    const handleScroll = () => {
      const container = reviewsContainerRef;
      const scrolledToBottom = 
        container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

      if (scrolledToBottom && visibleReviewsCount < reviews.length) {
        setVisibleReviewsCount(prev => Math.min(prev + 5, reviews.length));
      }
    };

    reviewsContainerRef.addEventListener('scroll', handleScroll);
    return () => reviewsContainerRef.removeEventListener('scroll', handleScroll);
  }, [reviewsContainerRef, visibleReviewsCount, reviews.length]);

  const visibleReviews = reviews.slice(0, visibleReviewsCount);

  if (!city) {
    return null;
  }

  const safetyRating = (city.avgSafetyRating ?? 0) > 0 ? (city.avgSafetyRating ?? 0) : city.safetyRating > 0 ? city.safetyRating / 2 : 0;
  const safetyColor = getSafetyColor(safetyRating);
  const SafetyIcon = getSafetyIcon(city.officialStatus);

  return (
    <div ref={setReviewsContainerRef} className="relative min-h-full overflow-y-auto">
      {!showReviewForm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-5 right-5 z-[100] p-3 text-gray-600 transition-colors hover:text-gray-900 touch-manipulation cursor-pointer"
          aria-label="Close panel"
          type="button"
        >
          <X className="h-6 w-6 pointer-events-none" />
        </button>
      )}

      {showReviewForm ? (
        <div className="min-h-full p-6 pt-8">
          <div className="mb-6">
            <div className="mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReviewForm(false);
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Back"
                type="button"
              >
                <ArrowLeft className="h-5 w-5 pointer-events-none" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Write a review for {city.name}</h2>
            {customLocation?.streetAddress && (
              <p className="mt-1 text-sm text-gray-600">
                {customLocation.streetAddress}
                {customLocation.neighborhood && ` • ${customLocation.neighborhood}`}
              </p>
            )}
            {customLocation && !customLocation.streetAddress && (
              <p className="mt-1 text-xs text-gray-500">
                {customLocation.lat.toFixed(6)}, {customLocation.lng.toFixed(6)}
              </p>
            )}
          </div>
          <ReviewForm
            city={city}
            customLocation={customLocation}
            onSuccess={() => {
              setShowReviewForm(false);
              onReviewSubmit?.();
            }}
          />
        </div>
      ) : (
        <div className="space-y-6 p-6 pt-8">
          {/* Compact Mobile View - Show when collapsed */}
          {isMobile && !isExpanded ? (
            <div className="flex flex-col justify-between pt-2 pb-2 pr-12" style={{ height: "calc(30vh - 60px)" }}>
              <div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{city.name}</h2>
                  <p className="text-lg text-gray-700">{city.country}</p>
                </div>
                <div className="mt-5 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12" style={{ filter: getRatingColor((city.avgSafetyRating ?? 0) > 0 ? (city.avgSafetyRating ?? 0) : city.safetyRating > 0 ? city.safetyRating / 2 : 0).filter }}>
                      <Image src="/shield-check.svg" alt="Safety" width={48} height={48} className="h-full w-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-4xl font-bold text-gray-900">
                        {(city.avgSafetyRating ?? 0) > 0 ? (city.avgSafetyRating ?? 0).toFixed(1) : city.safetyRating > 0 ? (city.safetyRating / 2).toFixed(1) : '-'}
                      </span>
                      <span className="text-sm text-gray-600">Safety</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12" style={{ filter: getRatingColor(city.avgTasteRating ?? 0).filter }}>
                      <GlassWater className="h-full w-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-4xl font-bold text-gray-900">
                        {(city.avgTasteRating ?? 0) > 0 ? (city.avgTasteRating ?? 0).toFixed(1) : '-'}
                      </span>
                      <span className="text-sm text-gray-600">Taste</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 pb-4">Swipe up for details</p>
            </div>
          ) : (
            <>
              {/* Full View - Desktop or Expanded Mobile */}
              <div className="space-y-6">
                <div className="pr-8">
                  <h2 className="text-3xl font-bold text-gray-900">{city.name}</h2>
                  <p className="text-lg text-gray-700">{city.country}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <p className="text-base font-semibold text-gray-900">
                      {city.reviewCount || 0} {city.reviewCount === 1 ? 'Review' : 'Reviews'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="flex items-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-sky-700"
                  >
                    <Edit3 className="h-4 w-4" />
                    Write Review
                  </button>
                </div>
              </div>

              {/* Detailed Content - Only show when expanded */}
              {(!isMobile || isExpanded) && (
                <>
                  {/* Safety Rating - Prominent Display */}
                  {((city.avgSafetyRating ?? 0) > 0 || city.safetyRating > 0) ? (
        <div className="flex items-center gap-4 rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-white/70">
          <div
            className="h-12 w-12"
            style={{
              filter: safetyColor.filter
            }}
          >
            <Image
              src="/shield-check.svg"
              alt="Safety"
              width={48}
              height={48}
              className="h-full w-full"
            />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-800">
              Average Safety Rating
            </p>
            <p className="text-xs text-gray-500 mb-1">
              Aggregate of {city.reviewCount || 0} {city.reviewCount === 1 ? 'review' : 'reviews'}
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${safetyColor.text}`}>
                {(city.avgSafetyRating ?? 0) > 0 
                  ? (city.avgSafetyRating ?? 0).toFixed(1) 
                  : (city.safetyRating / 2).toFixed(1)
                }
              </p>
              <span className="text-sm text-gray-600">/ 5</span>
            </div>
          </div>
          {city.officialStatus !== 'unknown' && (
            <div className={`rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide ${safetyColor.bg} ${safetyColor.text}`}>
              {city.officialStatus}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500">No safety rating available yet</p>
            <p className="mt-1 text-xs text-gray-400">Be the first to review this city!</p>
          </div>
        </div>
      )}

      {/* Community Taste Profile */}
      {(city.avgTasteRating ?? 0) > 0 && (
        <div className="flex items-center gap-4 rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-white/70">
          <div
            className="h-12 w-12"
            style={{
              filter: getRatingColor(city.avgTasteRating ?? 0).filter
            }}
          >
            <GlassWater className="h-full w-full" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-800">
              Average Taste Rating
            </p>
            <p className="text-xs text-gray-500 mb-1">
              Aggregate of {city.reviewCount || 0} {city.reviewCount === 1 ? 'review' : 'reviews'}
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${getRatingColor(city.avgTasteRating ?? 0).text}`}>
                {(city.avgTasteRating ?? 0).toFixed(1)}
              </p>
              <span className="text-sm text-gray-600">/ 5</span>
            </div>
          </div>
        </div>
      )}

      {/* Water Quality Metrics */}
      {(city.phLevel || city.chlorineLevel || city.hardness || city.tds || city.waterSource || city.treatmentProcess) ? (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Beaker className="h-5 w-5" />
            Water Quality
          </h3>
          {(city.phLevel || city.chlorineLevel || city.hardness || city.tds) && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="pH Level"
                value={city.phLevel}
                unit=""
                info="7 is neutral"
              />
              <MetricCard
                label="Chlorine"
                value={city.chlorineLevel}
                unit="mg/L"
                info="Disinfectant level"
              />
              <MetricCard
                label="Hardness"
                value={city.hardness}
                isText
                info="Mineral content"
              />
              <MetricCard
                label="TDS"
                value={city.tds}
                unit="mg/L"
                info="Total dissolved solids"
              />
            </div>
          )}

          {/* Source & Treatment Info */}
          {(city.waterSource || city.treatmentProcess) && (
            <div className="mt-4 space-y-3 text-sm">
              {city.waterSource && (
                <InfoRow label="Water Source" value={city.waterSource} />
              )}
              {city.treatmentProcess && (
                <InfoRow
                  label="Treatment Process"
                  value={city.treatmentProcess}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-white/60 p-5 text-center backdrop-blur-md">
          <p className="text-sm text-gray-500">No water quality data available</p>
        </div>
      )}

      {/* Community Reviews */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Individual Reviews in {city.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Each review represents a specific location within this area
          </p>
        </div>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            <>
              {visibleReviews.map((review) => (
                <ReviewCard 
                  key={`${review.id}-${review.safetyRating}-${review.tasteRating}-${review.createdAt}`} 
                  review={review} 
                  isHighlighted={selectedReviewId === review.id}
                  onClick={() => onReviewClick?.(review)}
                />
              ))}
              {visibleReviewsCount < reviews.length && (
                <div className="py-4 text-center text-sm text-gray-500">
                  Showing {visibleReviewsCount} of {reviews.length} reviews. Scroll for more...
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* End of Detailed Content */}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricCard({
  label,
  value,
  unit = "",
  info,
  isText = false,
}: {
  label: string;
  value: number | string | null;
  unit?: string;
  info?: string;
  isText?: boolean;
}) {
  const displayValue =
    value == null
      ? "—"
      : isText
        ? String(value).charAt(0).toUpperCase() + String(value).slice(1)
        : `${value}${unit}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
          {label}
        </p>
        {info && (
          <div className="group relative">
            <HelpCircle className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full right-0 mb-1 hidden w-32 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
              {info}
            </div>
          </div>
        )}
      </div>
      <p className="mt-1 text-lg font-semibold text-gray-900">{displayValue}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

function ReviewCard({ review, isHighlighted = false, onClick }: { review: Review; isHighlighted?: boolean; onClick?: () => void }) {
  // Memoize formatted date to avoid recalculating on every render
  const formattedDate = useMemo(() => formatDate(review.createdAt), [review.createdAt]);
  const [fetchedLocationName, setFetchedLocationName] = useState<string>("");
  
  // Use cached location data from database, or fetch if missing
  const cachedLocationName = useMemo(() => {
    if (review.streetAddress && review.locationName) {
      return `${review.streetAddress}, ${review.locationName}`;
    }
    if (review.streetAddress) return review.streetAddress;
    if (review.locationName) return review.locationName;
    return null;
  }, [review.streetAddress, review.locationName]);

  // Fetch location if not cached in database
  useEffect(() => {
    if (cachedLocationName || fetchedLocationName) return;
    
    const fetchLocation = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${review.latitude}&lon=${review.longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TapWaterRating/1.0',
              'Accept-Language': 'en,sr-Latn,bs,hr,sl,sq'
            }
          }
        );
        
        if (!response.ok) {
          console.warn('Geocoding failed with status:', response.status);
          return;
        }
        
        const data = await response.json();
        
        const address = data.address;
        if (address) {
          const parts = [];
          if (address.road) parts.push(address.road);
          if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
          if (parts.length > 0) {
            setFetchedLocationName(parts.join(", "));
          } else if (address.city || address.town || address.village) {
            setFetchedLocationName(address.city || address.town || address.village);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch location name:", error);
        // Silently fail - will show coordinates as fallback
      }
    };
    
    fetchLocation();
  }, [review.latitude, review.longitude, cachedLocationName, fetchedLocationName]);

  const locationName = cachedLocationName || fetchedLocationName;
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-3xl p-5 backdrop-blur-md transition-all cursor-pointer ${
        isHighlighted 
          ? 'bg-blue-100/80 ring-2 ring-blue-500 shadow-lg' 
          : 'bg-white/60 hover:bg-white/70'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <div
                className="h-6 w-6"
                style={{
                  filter: getSafetyColor(review.safetyRating).filter
                }}
              >
                <Image
                  src="/shield-check.svg"
                  alt="Safety"
                  width={24}
                  height={24}
                  className="h-full w-full"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {review.safetyRating}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">Safety</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <div
                className="h-6 w-6"
                style={{
                  filter: getRatingColor(review.tasteRating).filter
                }}
              >
                <GlassWater className="h-full w-full" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {review.tasteRating}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">Taste</p>
          </div>
        </div>
        <div className="text-right">
          {locationName && (
            <div className="text-xs text-gray-700 mb-1 font-medium max-w-[150px] text-right">
              {locationName}
            </div>
          )}
          {!locationName && (
            <div className="text-xs text-gray-500 mb-1">
              {review.latitude.toFixed(4)}, {review.longitude.toFixed(4)}
            </div>
          )}
          <div className="text-xs text-gray-600">
            {formattedDate}
          </div>
        </div>
      </div>

      {review.reviewText && (
        <p className="mt-3 text-sm leading-relaxed text-gray-800">
          {review.reviewText}
        </p>
      )}

      {/* User-reported metrics */}
      {(review.phLevel || review.hardness || review.waterSource || review.treatmentProcess) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.phLevel && (
            <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed text-gray-800">
              pH: {Number(review.phLevel).toFixed(1)}
            </span>
          )}
          {review.hardness && (
            <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed text-gray-800">
              Hardness: {review.hardness.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>
          )}
          {review.waterSource && (
            <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed text-gray-800">
              Source: {review.waterSource.charAt(0).toUpperCase() + review.waterSource.slice(1)}
            </span>
          )}
          {review.treatmentProcess && (
            <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed text-gray-800">
              Treatment: {review.treatmentProcess.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>
          )}
        </div>
      )}

      {(review.helpfulCount ?? 0) > 0 && (
        <div className="mt-3 text-xs text-gray-600">
          {review.helpfulCount} {review.helpfulCount === 1 ? "person" : "people"}{" "}
          found this helpful
        </div>
      )}
    </div>
  );
}

// Helper Functions
// Get color based on rating: red (1) -> orange (2) -> yellow (3) -> light blue (4) -> dark blue (5)
function getRatingColor(rating: number) {
  if (rating >= 4.5) {
    return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: "text-blue-600",
      filter: "invert(37%) sepia(93%) saturate(1352%) hue-rotate(195deg) brightness(91%) contrast(101%)", // dark blue
      fill: "fill-blue-600",
      textColor: "text-blue-700",
    };
  } else if (rating >= 3.5) {
    return {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
      icon: "text-sky-600",
      filter: "invert(70%) sepia(35%) saturate(679%) hue-rotate(169deg) brightness(96%) contrast(92%)", // light blue
      fill: "fill-sky-500",
      textColor: "text-sky-600",
    };
  } else if (rating >= 2.5) {
    return {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      icon: "text-yellow-600",
      filter: "invert(77%) sepia(61%) saturate(411%) hue-rotate(359deg) brightness(98%) contrast(92%)", // yellow
      fill: "fill-yellow-500",
      textColor: "text-yellow-600",
    };
  } else if (rating >= 1.5) {
    return {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      icon: "text-orange-600",
      filter: "invert(58%) sepia(73%) saturate(1352%) hue-rotate(351deg) brightness(98%) contrast(97%)", // orange
      fill: "fill-orange-500",
      textColor: "text-orange-600",
    };
  } else {
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: "text-red-600",
      filter: "invert(27%) sepia(93%) saturate(4526%) hue-rotate(348deg) brightness(89%) contrast(93%)", // red
      fill: "fill-red-500",
      textColor: "text-red-600",
    };
  }
}

function getSafetyColor(rating: number) {
  return getRatingColor(rating);
}

function getSafetyIcon(status: string) {
  switch (status) {
    case "safe":
      return CheckCircle;
    case "caution":
      return AlertTriangle;
    case "unsafe":
      return AlertCircle;
    default:
      return HelpCircle;
  }
}

function formatDate(date: Date | number | null | undefined) {
  if (!date) return "—";
  try {
    const d = typeof date === "number" ? new Date(date) : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
