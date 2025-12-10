/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

// 100+ major cities worldwide - users will add reviews and detailed water quality data
const cities = [
  // Europe
  { id: "london", name: "London", country: "United Kingdom", countryCode: "GB", latitude: 51.5074, longitude: -0.1278 },
  { id: "paris", name: "Paris", country: "France", countryCode: "FR", latitude: 48.8566, longitude: 2.3522 },
  { id: "berlin", name: "Berlin", country: "Germany", countryCode: "DE", latitude: 52.5200, longitude: 13.4050 },
  { id: "madrid", name: "Madrid", country: "Spain", countryCode: "ES", latitude: 40.4168, longitude: -3.7038 },
  { id: "barcelona", name: "Barcelona", country: "Spain", countryCode: "ES", latitude: 41.3851, longitude: 2.1734 },
  { id: "rome", name: "Rome", country: "Italy", countryCode: "IT", latitude: 41.9028, longitude: 12.4964 },
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands", countryCode: "NL", latitude: 52.3676, longitude: 4.9041 },
  { id: "vienna", name: "Vienna", country: "Austria", countryCode: "AT", latitude: 48.2082, longitude: 16.3738 },
  { id: "zurich", name: "Zurich", country: "Switzerland", countryCode: "CH", latitude: 47.3769, longitude: 8.5417 },
  { id: "oslo", name: "Oslo", country: "Norway", countryCode: "NO", latitude: 59.9139, longitude: 10.7522 },
  { id: "stockholm", name: "Stockholm", country: "Sweden", countryCode: "SE", latitude: 59.3293, longitude: 18.0686 },
  { id: "copenhagen", name: "Copenhagen", country: "Denmark", countryCode: "DK", latitude: 55.6761, longitude: 12.5683 },
  { id: "helsinki", name: "Helsinki", country: "Finland", countryCode: "FI", latitude: 60.1699, longitude: 24.9384 },
  { id: "dublin", name: "Dublin", country: "Ireland", countryCode: "IE", latitude: 53.3498, longitude: -6.2603 },
  { id: "lisbon", name: "Lisbon", country: "Portugal", countryCode: "PT", latitude: 38.7223, longitude: -9.1393 },
  { id: "prague", name: "Prague", country: "Czech Republic", countryCode: "CZ", latitude: 50.0755, longitude: 14.4378 },
  { id: "warsaw", name: "Warsaw", country: "Poland", countryCode: "PL", latitude: 52.2297, longitude: 21.0122 },
  { id: "budapest", name: "Budapest", country: "Hungary", countryCode: "HU", latitude: 47.4979, longitude: 19.0402 },
  
  // Asia
  { id: "tokyo", name: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.6762, longitude: 139.6503 },
  { id: "singapore", name: "Singapore", country: "Singapore", countryCode: "SG", latitude: 1.3521, longitude: 103.8198 },
  { id: "seoul", name: "Seoul", country: "South Korea", countryCode: "KR", latitude: 37.5665, longitude: 126.9780 },
  { id: "hong-kong", name: "Hong Kong", country: "Hong Kong", countryCode: "HK", latitude: 22.3193, longitude: 114.1694 },
  { id: "dubai", name: "Dubai", country: "UAE", countryCode: "AE", latitude: 25.2048, longitude: 55.2708 },
  { id: "tel-aviv", name: "Tel Aviv", country: "Israel", countryCode: "IL", latitude: 32.0853, longitude: 34.7818 },
  { id: "bangkok", name: "Bangkok", country: "Thailand", countryCode: "TH", latitude: 13.7563, longitude: 100.5018 },
  { id: "manila", name: "Manila", country: "Philippines", countryCode: "PH", latitude: 14.5995, longitude: 120.9842 },
  { id: "jakarta", name: "Jakarta", country: "Indonesia", countryCode: "ID", latitude: -6.2088, longitude: 106.8456 },
  { id: "mumbai", name: "Mumbai", country: "India", countryCode: "IN", latitude: 19.0760, longitude: 72.8777 },
  { id: "delhi", name: "Delhi", country: "India", countryCode: "IN", latitude: 28.7041, longitude: 77.1025 },
  { id: "beijing", name: "Beijing", country: "China", countryCode: "CN", latitude: 39.9042, longitude: 116.4074 },
  { id: "shanghai", name: "Shanghai", country: "China", countryCode: "CN", latitude: 31.2304, longitude: 121.4737 },

  // North America
  { id: "new-york", name: "New York", country: "United States", countryCode: "US", latitude: 40.7128, longitude: -74.0060 },
  { id: "los-angeles", name: "Los Angeles", country: "United States", countryCode: "US", latitude: 34.0522, longitude: -118.2437 },
  { id: "chicago", name: "Chicago", country: "United States", countryCode: "US", latitude: 41.8781, longitude: -87.6298 },
  { id: "toronto", name: "Toronto", country: "Canada", countryCode: "CA", latitude: 43.6532, longitude: -79.3832 },
  { id: "vancouver", name: "Vancouver", country: "Canada", countryCode: "CA", latitude: 49.2827, longitude: -123.1207 },
  { id: "montreal", name: "Montreal", country: "Canada", countryCode: "CA", latitude: 45.5017, longitude: -73.5673 },
  { id: "mexico-city", name: "Mexico City", country: "Mexico", countryCode: "MX", latitude: 19.4326, longitude: -99.1332 },

  // South America
  { id: "sao-paulo", name: "São Paulo", country: "Brazil", countryCode: "BR", latitude: -23.5505, longitude: -46.6333 },
  { id: "rio-de-janeiro", name: "Rio de Janeiro", country: "Brazil", countryCode: "BR", latitude: -22.9068, longitude: -43.1729 },
  { id: "buenos-aires", name: "Buenos Aires", country: "Argentina", countryCode: "AR", latitude: -34.6037, longitude: -58.3816 },
  { id: "santiago", name: "Santiago", country: "Chile", countryCode: "CL", latitude: -33.4489, longitude: -70.6693 },
  { id: "lima", name: "Lima", country: "Peru", countryCode: "PE", latitude: -12.0464, longitude: -77.0428 },
  { id: "bogota", name: "Bogotá", country: "Colombia", countryCode: "CO", latitude: 4.7110, longitude: -74.0721 },

  // Oceania
  { id: "sydney", name: "Sydney", country: "Australia", countryCode: "AU", latitude: -33.8688, longitude: 151.2093 },
  { id: "melbourne", name: "Melbourne", country: "Australia", countryCode: "AU", latitude: -37.8136, longitude: 144.9631 },
  { id: "auckland", name: "Auckland", country: "New Zealand", countryCode: "NZ", latitude: -36.8485, longitude: 174.7633 },

  // Africa
  { id: "cape-town", name: "Cape Town", country: "South Africa", countryCode: "ZA", latitude: -33.9249, longitude: 18.4241 },
  { id: "nairobi", name: "Nairobi", country: "Kenya", countryCode: "KE", latitude: -1.2921, longitude: 36.8219 },
  { id: "cairo", name: "Cairo", country: "Egypt", countryCode: "EG", latitude: 30.0444, longitude: 31.2357 },
  { id: "lagos", name: "Lagos", country: "Nigeria", countryCode: "NG", latitude: 6.5244, longitude: 3.3792 },

  // More US Cities
  { id: "san-francisco", name: "San Francisco", country: "United States", countryCode: "US", latitude: 37.7749, longitude: -122.4194 },
  { id: "boston", name: "Boston", country: "United States", countryCode: "US", latitude: 42.3601, longitude: -71.0589 },
  { id: "seattle", name: "Seattle", country: "United States", countryCode: "US", latitude: 47.6062, longitude: -122.3321 },
  { id: "miami", name: "Miami", country: "United States", countryCode: "US", latitude: 25.7617, longitude: -80.1918 },
  { id: "denver", name: "Denver", country: "United States", countryCode: "US", latitude: 39.7392, longitude: -104.9903 },
  { id: "atlanta", name: "Atlanta", country: "United States", countryCode: "US", latitude: 33.7490, longitude: -84.3880 },
  { id: "austin", name: "Austin", country: "United States", countryCode: "US", latitude: 30.2672, longitude: -97.7431 },

  // More European Cities
  { id: "brussels", name: "Brussels", country: "Belgium", countryCode: "BE", latitude: 50.8503, longitude: 4.3517 },
  { id: "munich", name: "Munich", country: "Germany", countryCode: "DE", latitude: 48.1351, longitude: 11.5820 },
  { id: "milan", name: "Milan", country: "Italy", countryCode: "IT", latitude: 45.4642, longitude: 9.1900 },
  { id: "athens", name: "Athens", country: "Greece", countryCode: "GR", latitude: 37.9838, longitude: 23.7275 },
  { id: "edinburgh", name: "Edinburgh", country: "United Kingdom", countryCode: "GB", latitude: 55.9533, longitude: -3.1883 },
  { id: "lyon", name: "Lyon", country: "France", countryCode: "FR", latitude: 45.7640, longitude: 4.8357 },
  
  // More Asian Cities
  { id: "osaka", name: "Osaka", country: "Japan", countryCode: "JP", latitude: 34.6937, longitude: 135.5023 },
  { id: "kuala-lumpur", name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", latitude: 3.1390, longitude: 101.6869 },
  { id: "hanoi", name: "Hanoi", country: "Vietnam", countryCode: "VN", latitude: 21.0285, longitude: 105.8542 },
  { id: "ho-chi-minh", name: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", latitude: 10.8231, longitude: 106.6297 },
  { id: "taipei", name: "Taipei", country: "Taiwan", countryCode: "TW", latitude: 25.0330, longitude: 121.5654 },
  { id: "istanbul", name: "Istanbul", country: "Turkey", countryCode: "TR", latitude: 41.0082, longitude: 28.9784 },
  { id: "riyadh", name: "Riyadh", country: "Saudi Arabia", countryCode: "SA", latitude: 24.7136, longitude: 46.6753 },
  
  // Eastern Europe
  { id: "moscow", name: "Moscow", country: "Russia", countryCode: "RU", latitude: 55.7558, longitude: 37.6173 },
  { id: "st-petersburg", name: "St. Petersburg", country: "Russia", countryCode: "RU", latitude: 59.9311, longitude: 30.3609 },
  { id: "bucharest", name: "Bucharest", country: "Romania", countryCode: "RO", latitude: 44.4268, longitude: 26.1025 },
  { id: "sofia", name: "Sofia", country: "Bulgaria", countryCode: "BG", latitude: 42.6977, longitude: 23.3219 },
  
  // Middle East
  { id: "doha", name: "Doha", country: "Qatar", countryCode: "QA", latitude: 25.2854, longitude: 51.5310 },
  { id: "abu-dhabi", name: "Abu Dhabi", country: "UAE", countryCode: "AE", latitude: 24.4539, longitude: 54.3773 },
  { id: "beirut", name: "Beirut", country: "Lebanon", countryCode: "LB", latitude: 33.8886, longitude: 35.4955 },
  
  // Latin America
  { id: "cartagena", name: "Cartagena", country: "Colombia", countryCode: "CO", latitude: 10.3910, longitude: -75.4794 },
  { id: "quito", name: "Quito", country: "Ecuador", countryCode: "EC", latitude: -0.1807, longitude: -78.4678 },
  { id: "havana", name: "Havana", country: "Cuba", countryCode: "CU", latitude: 23.1136, longitude: -82.3666 },
  { id: "san-jose", name: "San José", country: "Costa Rica", countryCode: "CR", latitude: 9.9281, longitude: -84.0907 },
  { id: "panama-city", name: "Panama City", country: "Panama", countryCode: "PA", latitude: 8.9824, longitude: -79.5199 },
  
  // Africa
  { id: "marrakech", name: "Marrakech", country: "Morocco", countryCode: "MA", latitude: 31.6295, longitude: -7.9811 },
  { id: "tunis", name: "Tunis", country: "Tunisia", countryCode: "TN", latitude: 36.8065, longitude: 10.1815 },
  { id: "addis-ababa", name: "Addis Ababa", country: "Ethiopia", countryCode: "ET", latitude: 9.0320, longitude: 38.7469 },
  { id: "accra", name: "Accra", country: "Ghana", countryCode: "GH", latitude: 5.6037, longitude: -0.1870 },
  
  // Oceania
  { id: "wellington", name: "Wellington", country: "New Zealand", countryCode: "NZ", latitude: -41.2865, longitude: 174.7762 },
  { id: "perth", name: "Perth", country: "Australia", countryCode: "AU", latitude: -31.9505, longitude: 115.8605 },
  { id: "brisbane", name: "Brisbane", country: "Australia", countryCode: "AU", latitude: -27.4698, longitude: 153.0251 },
  
  // More Canadian Cities
  { id: "calgary", name: "Calgary", country: "Canada", countryCode: "CA", latitude: 51.0447, longitude: -114.0719 },
  { id: "ottawa", name: "Ottawa", country: "Canada", countryCode: "CA", latitude: 45.4215, longitude: -75.6972 },
  { id: "quebec-city", name: "Quebec City", country: "Canada", countryCode: "CA", latitude: 46.8139, longitude: -71.2080 },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  console.log(`🌍 Seeding ${cities.length} city locations...`);

  // Insert cities with location data only - users will add water quality data via reviews
  for (const city of cities) {
    const now = Date.now();
    await client.execute({
      sql: `INSERT OR IGNORE INTO cities (
        id, name, country, country_code, latitude, longitude, 
        safety_rating, official_status, avg_taste_rating, avg_safety_rating, 
        review_count, data_source, last_updated, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      args: [
        city.id,
        city.name,
        city.country,
        city.countryCode,
        city.latitude,
        city.longitude,
        0,  // safetyRating - default
        'unknown',  // officialStatus - default
        0,  // avgTasteRating - default
        0,  // avgSafetyRating - default
        0,  // reviewCount - default
        "seed",  // dataSource
        now,  // lastUpdated
        now,  // createdAt
      ],
    });
  }

  console.log(`✅ Successfully seeded ${cities.length} cities!`);
  console.log(`💧 Users can now add reviews and water quality data for these cities.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
