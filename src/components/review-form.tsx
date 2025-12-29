"use client";

import { City } from "@/db/schema";
import { useState } from "react";
import { GlassWater, Send, Loader2 } from "lucide-react";
import Image from "next/image";

type Props = {
  city: City;
  onSuccess?: () => void;
  customLocation?: { lat: number; lng: number } | null;
};

export function ReviewForm({ city, onSuccess, customLocation }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Rating states
  const [tasteRating, setTasteRating] = useState(0);
  const [safetyRating, setSafetyRating] = useState(0);
  const [tasteHover, setTasteHover] = useState(0);
  const [safetyHover, setSafetyHover] = useState(0);

  // Optional fields
  const [reviewText, setReviewText] = useState("");
  const [phLevel, setPhLevel] = useState("");
  const [hardness, setHardness] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [waterSourceOther, setWaterSourceOther] = useState("");
  const [treatmentProcess, setTreatmentProcess] = useState("");
  const [treatmentProcessOther, setTreatmentProcessOther] = useState("");
  
  // Honeypot field for spam detection
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Check honeypot - if filled, it's likely a bot
    if (honeypot) {
      console.warn("Honeypot triggered - potential spam submission");
      return;
    }

    if (!tasteRating || !safetyRating) {
      setError("Please provide both taste and safety ratings");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        cityId: String(city.id),
        tasteRating,
        safetyRating,
        // Use custom location if available, otherwise use city coordinates
        latitude: customLocation?.lat ?? city.latitude,
        longitude: customLocation?.lng ?? city.longitude,
      };

      // If this is a new city (id === "-1"), include city information
      if (city.id === "-1") {
        payload.cityName = city.name;
        payload.cityCountry = city.country;
        payload.cityCountryCode = city.countryCode;
      }

      if (reviewText.trim()) payload.reviewText = reviewText.trim();
      if (phLevel) payload.phLevel = parseFloat(phLevel);
      if (hardness) payload.hardness = hardness;
      
      // Use custom value if "other" is selected, otherwise use the selected option
      if (waterSource) {
        payload.waterSource = waterSource === "other" ? waterSourceOther.trim() : waterSource;
      }
      if (treatmentProcess) {
        payload.treatmentProcess = treatmentProcess === "other" ? treatmentProcessOther.trim() : treatmentProcess;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      
      // Reset form
      setTasteRating(0);
      setSafetyRating(0);
      setReviewText("");
      setPhLevel("");
      setHardness("");
      setWaterSource("");
      setWaterSourceOther("");
      setTreatmentProcess("");
      setTreatmentProcessOther("");
      setHoneypot("");

      // Call success callback
      onSuccess?.();

      // Auto-hide success message
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field - hidden from users but visible to bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none"
        }}
      />

      {/* Ratings */}
      <div className="space-y-6">
        {/* Safety Rating */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Safety Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => {
              const getRatingFilter = (rating: number) => {
                if (rating >= 5) return "invert(37%) sepia(93%) saturate(1352%) hue-rotate(195deg) brightness(91%) contrast(101%) drop-shadow(0 1px 2px rgba(0,0,0,0.15))"; // dark blue
                if (rating >= 4) return "invert(70%) sepia(35%) saturate(679%) hue-rotate(169deg) brightness(96%) contrast(92%) drop-shadow(0 1px 2px rgba(0,0,0,0.15))"; // light blue
                if (rating >= 3) return "invert(77%) sepia(61%) saturate(411%) hue-rotate(359deg) brightness(98%) contrast(92%) drop-shadow(0 1px 2px rgba(0,0,0,0.15))"; // yellow
                if (rating >= 2) return "invert(58%) sepia(73%) saturate(1352%) hue-rotate(351deg) brightness(98%) contrast(97%) drop-shadow(0 1px 2px rgba(0,0,0,0.15))"; // orange
                return "invert(27%) sepia(93%) saturate(4526%) hue-rotate(348deg) brightness(89%) contrast(93%) drop-shadow(0 1px 2px rgba(0,0,0,0.15))"; // red
              };
              const currentRating = safetyHover || safetyRating;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSafetyRating(level)}
                  onMouseEnter={() => setSafetyHover(level)}
                  onMouseLeave={() => setSafetyHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <div
                    className={`h-8 w-8 transition-all ${
                      level <= currentRating ? "opacity-100" : "opacity-30"
                    }`}
                    style={{
                      filter: level <= currentRating ? getRatingFilter(currentRating) : "none"
                    }}
                  >
                    <Image
                      src="/shield-check.svg"
                      alt="Safety"
                      width={32}
                      height={32}
                      className="h-full w-full"
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {safetyRating > 0 ? `${safetyRating} out of 5` : "Click to rate"}
          </p>
        </div>

        {/* Taste Rating */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Taste Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => {
              const getRatingColor = (rating: number) => {
                if (rating >= 5) return "fill-blue-200 text-blue-700";
                if (rating >= 4) return "fill-sky-200 text-sky-600";
                if (rating >= 3) return "fill-yellow-200 text-yellow-600";
                if (rating >= 2) return "fill-orange-200 text-orange-600";
                return "fill-red-200 text-red-600";
              };
              const currentRating = tasteHover || tasteRating;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTasteRating(level)}
                  onMouseEnter={() => setTasteHover(level)}
                  onMouseLeave={() => setTasteHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <GlassWater
                    className={`h-8 w-8 transition-all ${
                      level <= currentRating
                        ? getRatingColor(currentRating)
                        : "text-gray-300"
                    }`}
                    style={{
                      filter: level <= currentRating ? "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" : undefined
                    }}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {tasteRating > 0 ? `${tasteRating} out of 5` : "Click to rate"}
          </p>
        </div>
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="reviewText" className="mb-2 block text-sm font-semibold text-gray-900">
          Your Experience (Optional)
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about the water quality, taste, or any tips for other travelers..."
          maxLength={1000}
          rows={4}
          className="w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm text-gray-900 backdrop-blur-sm transition-all placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        />
        <p className="mt-1 text-xs text-gray-600">
          {reviewText.length}/1000 characters
        </p>
      </div>

      {/* Optional Metrics */}
      <div className="rounded-3xl border border-white/40 bg-white/60 p-6 backdrop-blur-md">
        <h4 className="mb-4 text-sm font-semibold text-gray-900">
          Water Quality Metrics (Optional)
        </h4>
        <div className="space-y-4">
          {/* pH Level */}
          <div>
            <label htmlFor="phLevel" className="mb-1 block text-xs font-medium text-gray-800">
              pH Level
            </label>
            <input
              id="phLevel"
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={phLevel}
              onChange={(e) => setPhLevel(e.target.value)}
              placeholder="e.g., 7.5"
              className="w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-gray-900 backdrop-blur-sm transition-all placeholder:text-gray-600 focus:border-emerald-500/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Hardness */}
          <div>
            <label htmlFor="hardness" className="mb-1 block text-xs font-medium text-gray-800">
              Water Hardness
            </label>
            <select
              id="hardness"
              value={hardness}
              onChange={(e) => setHardness(e.target.value)}
              className="w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-gray-900 backdrop-blur-sm transition-all focus:border-blue-500/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">Select...</option>
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="very-hard">Very Hard</option>
            </select>
          </div>

          {/* Water Source */}
          <div>
            <label htmlFor="waterSource" className="mb-1 block text-xs font-medium text-gray-800">
              Water Source
            </label>
            <select
              id="waterSource"
              value={waterSource}
              onChange={(e) => {
                setWaterSource(e.target.value);
                if (e.target.value !== "other") setWaterSourceOther("");
              }}
              className="w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-gray-900 backdrop-blur-sm transition-all focus:border-blue-500/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">Select...</option>
              <option value="municipal">Municipal/Tap Water</option>
              <option value="well">Well Water</option>
              <option value="spring">Spring Water</option>
              <option value="river">River Water</option>
              <option value="lake">Lake Water</option>
              <option value="groundwater">Groundwater</option>
              <option value="rainwater">Rainwater</option>
              <option value="desalination">Desalination</option>
              <option value="other">Other</option>
            </select>
            {waterSource === "other" && (
              <input
                type="text"
                value={waterSourceOther}
                onChange={(e) => setWaterSourceOther(e.target.value)}
                placeholder="Please specify water source"
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-gray-900 backdrop-blur-sm transition-all placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            )}
          </div>

          {/* Treatment Process */}
          <div>
            <label htmlFor="treatmentProcess" className="mb-1 block text-xs font-medium text-gray-800">
              Treatment Process
            </label>
            <select
              id="treatmentProcess"
              value={treatmentProcess}
              onChange={(e) => {
                setTreatmentProcess(e.target.value);
                if (e.target.value !== "other") setTreatmentProcessOther("");
              }}
              className="w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-gray-900 backdrop-blur-sm transition-all focus:border-blue-500/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">Select...</option>
              <option value="chlorination">Chlorination</option>
              <option value="filtration">Filtration</option>
              <option value="uv-treatment">UV Treatment</option>
              <option value="ozonation">Ozonation</option>
              <option value="reverse-osmosis">Reverse Osmosis</option>
              <option value="boiling">Boiling</option>
              <option value="coagulation-flocculation">Coagulation/Flocculation</option>
              <option value="sedimentation">Sedimentation</option>
              <option value="activated-carbon">Activated Carbon</option>
              <option value="none">No Treatment</option>
              <option value="other">Other</option>
            </select>
            {treatmentProcess === "other" && (
              <input
                type="text"
                value={treatmentProcessOther}
                onChange={(e) => setTreatmentProcessOther(e.target.value)}
                placeholder="Please specify treatment process"
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-gray-900 backdrop-blur-sm transition-all placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200/50 bg-red-50/80 p-3 text-sm text-red-700 shadow-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-2xl border border-blue-200/50 bg-linear-to-br from-blue-50/90 to-sky-50/90 p-3 text-sm text-blue-700 shadow-lg backdrop-blur-sm">
          Review submitted successfully! Thank you for your contribution.
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !tasteRating || !safetyRating}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-sky-700 hover:shadow-xl hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Review
          </>
        )}
      </button>
    </form>
  );
}
