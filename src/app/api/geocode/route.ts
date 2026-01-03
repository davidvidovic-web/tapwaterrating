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

    // Get the most specific result (first one) for street address
    const specificResult = data.results[0];

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

    console.log('Selected city result types:', cityResult.types);
    console.log('Most specific result types:', specificResult.types);

    // Extract street address from the most specific result
    let streetNumber = "";
    let route = "";
    let neighborhood = "";

    for (const component of specificResult.address_components) {
      if (component.types.includes("street_number")) {
        streetNumber = component.long_name;
      } else if (component.types.includes("route")) {
        route = component.long_name;
      } else if (component.types.includes("neighborhood") || component.types.includes("sublocality")) {
        neighborhood = component.long_name;
      }
    }

    // Extract city name, country, and country code from city result
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
    console.log('Street address:', streetNumber, route, 'Neighborhood:', neighborhood);

    // Build street address
    let streetAddress = "";
    if (streetNumber && route) {
      streetAddress = `${streetNumber} ${route}`;
    } else if (route) {
      streetAddress = route;
    } else if (neighborhood) {
      // Use neighborhood if no street found
      streetAddress = neighborhood;
    } else if (!streetAddress && specificResult.formatted_address) {
      // Use first part of formatted address as fallback
      const addressParts = specificResult.formatted_address.split(",").map((p: string) => p.trim());
      // Skip if it looks like just coordinates or very generic
      if (addressParts[0] && !addressParts[0].match(/^[\d\s.,-]+$/)) {
        streetAddress = addressParts[0];
      }
    }

    return NextResponse.json({
      name: cityName,
      country: country,
      countryCode: countryCode,
      state: state,
      streetAddress: streetAddress,
      neighborhood: neighborhood,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      formattedAddress: specificResult.formatted_address,
      placeId: specificResult.place_id,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}
