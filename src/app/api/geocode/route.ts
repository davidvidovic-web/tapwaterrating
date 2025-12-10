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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  console.log('Geocoding request for:', lat, lng);
  console.log('API key available:', !!apiKey);
  
  if (!apiKey) {
    console.error('Google Maps API key not configured');
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    console.log('Google Maps API response status:', response.status);

    if (!response.ok) {
      throw new Error("Geocoding API request failed");
    }

    const data = await response.json();
    console.log('Google Maps API response:', data.status, 'Results:', data.results?.length);

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error('Geocoding error. Status:', data.status, 'Error message:', data.error_message);
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}` },
        { status: 404 }
      );
    }

    // Find the city-level result (ignore neighborhoods, streets, etc.)
    // Priority: locality (city) > administrative_area_level_2 (county/district)
    let cityResult = data.results.find((result: { types: string[] }) =>
      result.types.includes("locality") && !result.types.includes("sublocality")
    );

    // If no locality found, try administrative area level 2 (like county or district)
    if (!cityResult) {
      cityResult = data.results.find((result: { types: string[] }) =>
        result.types.includes("administrative_area_level_2")
      );
    }

    // If still nothing, try administrative area level 1 (like state/province)
    if (!cityResult) {
      cityResult = data.results.find((result: { types: string[] }) =>
        result.types.includes("administrative_area_level_1")
      );
    }

    if (!cityResult) {
      cityResult = data.results[0]; // Fallback to first result
    }

    console.log('Selected result types:', cityResult.types);

    // Extract city name, country, and country code from address components
    let cityName = "";
    let country = "";
    let countryCode = "";
    let state = "";

    for (const component of cityResult.address_components) {
      if (component.types.includes("locality")) {
        cityName = component.long_name;
      } else if (component.types.includes("administrative_area_level_2") && !cityName) {
        cityName = component.long_name;
      } else if (component.types.includes("administrative_area_level_1")) {
        state = component.short_name;
        // Use state as city name if we still don't have a city
        if (!cityName) {
          cityName = component.long_name;
        }
      } else if (component.types.includes("country")) {
        country = component.long_name;
        countryCode = component.short_name;
      }
    }

    // Use formatted address as fallback
    if (!cityName) {
      // Take the first part that's not a street number or route
      const addressParts = cityResult.formatted_address.split(",").map((p: string) => p.trim());
      cityName = addressParts[0];
    }

    console.log('Extracted city:', cityName, country);

    return NextResponse.json({
      name: cityName,
      country: country,
      countryCode: countryCode,
      state: state,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      formattedAddress: cityResult.formatted_address,
      placeId: cityResult.place_id,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}
