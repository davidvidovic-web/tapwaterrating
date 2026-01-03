import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "Missing placeId parameter" },
      { status: 400 }
    );
  }

  try {
    // Use Nominatim lookup API to get place details
    // https://nominatim.org/release-docs/latest/api/Lookup/
    const response = await fetch(
      `https://nominatim.openstreetmap.org/lookup?` +
        new URLSearchParams({
          osm_ids: `N${placeId}`, // Try as node first
          format: "json",
          addressdetails: "1",
        }),
      {
        headers: {
          "User-Agent": "TapWaterRating/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Nominatim Details API Error:", response.status);
      throw new Error(`Nominatim Details API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      // Try as way or relation if node didn't work
      const response2 = await fetch(
        `https://nominatim.openstreetmap.org/lookup?` +
          new URLSearchParams({
            osm_ids: `W${placeId},R${placeId}`,
            format: "json",
            addressdetails: "1",
          }),
        {
          headers: {
            "User-Agent": "TapWaterRating/1.0",
          },
        }
      );
      
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2 && data2.length > 0) {
          return transformToPlaceDetails(data2[0]);
        }
      }
      
      return NextResponse.json(
        { error: "Place not found" },
        { status: 404 }
      );
    }

    return transformToPlaceDetails(data[0]);
  } catch (error) {
    console.error("Places Details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}

function transformToPlaceDetails(place: any) {
  // Transform Nominatim response to match expected format
  const cityName = place.address?.city || place.address?.town || place.address?.village || place.name;
  const country = place.address?.country;
  
  return NextResponse.json({
    id: place.place_id.toString(),
    displayName: {
      text: cityName,
      languageCode: "en",
    },
    formattedAddress: place.display_name,
    location: {
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    },
    addressComponents: [
      place.address?.city && {
        longText: place.address.city,
        shortText: place.address.city,
        types: ["locality"],
      },
      place.address?.state && {
        longText: place.address.state,
        shortText: place.address.state,
        types: ["administrative_area_level_1"],
      },
      place.address?.country && {
        longText: place.address.country,
        shortText: place.address.country_code?.toUpperCase() || place.address.country,
        types: ["country"],
      },
    ].filter(Boolean),
  });
}
