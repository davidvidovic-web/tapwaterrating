import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing lat or lng parameter" },
      { status: 400 }
    );
  }

  try {
    // Use Nominatim reverse geocoding
    // https://nominatim.org/release-docs/latest/api/Reverse/
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({
          lat: lat,
          lon: lng,
          format: "json",
          addressdetails: "1",
          extratags: "1",
          "accept-language": "en",
          zoom: "18", // Most detailed level
        }),
      {
        headers: {
          "User-Agent": "TapWaterRating/1.0",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding API request failed");
    }

    const data = await response.json();

    if (!data || data.error) {
      console.error('Geocoding error:', data.error);
      return NextResponse.json(
        { error: `Geocoding failed: ${data.error || 'No results'}` },
        { status: 404 }
      );
    }

    // Extract address components from Nominatim response
    const address = data.address || {};
    const extratags = data.extratags || {};
    
    // Get city name (prefer English name if available)
    const cityName = extratags['name:en'] ||
                     address.city || 
                     address.town || 
                     address.village || 
                     address.municipality ||
                     address.county ||
                     address.state_district ||
                     address.state ||
                     data.namedetails?.['name:en'] ||
                     data.name;
    
    const country = address.country || "";
    const countryCode = address.country_code?.toUpperCase() || "";
    const state = address.state || "";
    
    // Build street address
    let streetAddress = "";
    const streetParts = [];
    
    if (address.house_number) streetParts.push(address.house_number);
    if (address.road) streetParts.push(address.road);
    
    if (streetParts.length > 0) {
      streetAddress = streetParts.join(" ");
    } else if (address.neighbourhood || address.suburb) {
      streetAddress = address.neighbourhood || address.suburb;
    }
    
    const neighborhood = address.neighbourhood || address.suburb || "";

    return NextResponse.json({
      name: cityName,
      country: country,
      countryCode: countryCode,
      state: state,
      streetAddress: streetAddress,
      neighborhood: neighborhood,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      formattedAddress: data.display_name,
      placeId: data.place_id?.toString() || "",
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}
