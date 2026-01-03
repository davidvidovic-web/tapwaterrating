import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json(
      { error: "Missing input parameter" },
      { status: 400 }
    );
  }

  try {
    // Use Nominatim (OpenStreetMap) for geocoding
    // https://nominatim.org/release-docs/latest/api/Search/
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: input,
          format: "json",
          addressdetails: "1",
          limit: "3",
        }),
      {
        headers: {
          "User-Agent": "TapWaterRating/1.0", // Required by Nominatim usage policy
        },
      }
    );

    if (!response.ok) {
      console.warn("Nominatim API Error:", response.status);
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const data = await response.json();
    console.log("Nominatim raw response:", JSON.stringify(data, null, 2));
    
    if (!data || data.length === 0) {
      console.log("No results from Nominatim for query:", input);
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }
    
    // Transform Nominatim response to match expected format
    const suggestions = data.map((place: any) => ({
      placePrediction: {
        place: `nominatim/${place.place_id}`,
        placeId: place.place_id.toString(),
        text: {
          text: place.display_name,
          matches: [],
        },
        structuredFormat: {
          mainText: { 
            text: place.address?.city || place.address?.town || place.address?.village || place.name,
            matches: [] 
          },
          secondaryText: { 
            text: [place.address?.state, place.address?.country].filter(Boolean).join(", ") 
          },
        },
        location: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
        },
        address: place.address,
      },
    }));

    console.log("Transformed suggestions:", suggestions.length);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Nominatim Autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to fetch autocomplete predictions" },
      { status: 500 }
    );
  }
}
