# Tap Water Rating

A web application for rating and reviewing tap water quality around the world. Users can view water quality data, submit reviews, and discover safe drinking water locations through an interactive map interface.

## Overview

Tap Water Rating helps travelers and residents make informed decisions about tap water safety by providing:

- Community-driven water quality ratings and reviews
- Interactive map interface for discovering locations
- Official water quality metrics (pH levels, hardness, chlorine levels, TDS)
- Location-based search and geolocation support
- User authentication via GitHub and Google OAuth

## Tech Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **Language**: TypeScript
- **Database**: Turso (LibSQL/SQLite)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **Maps**: Google Maps (via @vis.gl/react-google-maps)
- **UI Components**: Radix UI primitives
- **Data Fetching**: SWR

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or higher
- npm or yarn package manager
- Turso CLI (for database management)

## Installation

1. Clone the repository and navigate to the web directory:

```bash
cd web
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the web directory with the following variables:

```env
# Database Configuration
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
AUTH_GITHUB_ID=your-github-oauth-id
AUTH_GITHUB_SECRET=your-github-oauth-secret
AUTH_GOOGLE_ID=your-google-oauth-id
AUTH_GOOGLE_SECRET=your-google-oauth-secret

# Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Analytics & SEO (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code
```

4. Set up the database:

Refer to [DATABASE.md](DATABASE.md) for detailed database setup instructions, including:
- Creating a Turso database
- Applying schema migrations
- Seeding initial data

Quick setup:

```bash
npm run db:generate  # Generate migration files
npm run db:push      # Apply schema to database
npm run db:seed      # Seed initial data
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application will auto-reload when you make changes to the code.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migration files
- `npm run db:push` - Push schema changes to the database
- `npm run db:seed` - Seed the database with initial data

## Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # NextAuth endpoints
│   │   │   ├── cities/     # City data endpoints
│   │   │   ├── geocode/    # Geocoding service
│   │   │   └── reviews/    # Review submission
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page with map
│   ├── components/          # React components
│   │   ├── auth-button.tsx
│   │   ├── city-panel.tsx
│   │   ├── location-button.tsx
│   │   ├── logo.tsx
│   │   ├── map.tsx
│   │   ├── review-form.tsx
│   │   ├── search-bar.tsx
│   │   └── session-provider.tsx
│   ├── db/                  # Database configuration
│   │   ├── client.ts       # Turso client setup
│   │   └── schema.ts       # Drizzle schema definitions
│   ├── hooks/               # Custom React hooks
│   │   └── use-geolocation.ts
│   └── auth.ts             # NextAuth configuration
├── drizzle/                 # Database migrations
├── public/                  # Static assets
├── scripts/                 # Utility scripts
│   ├── seed.cjs            # Database seeding script
│   └── ...                 # Other utility scripts
├── drizzle.config.ts       # Drizzle ORM configuration
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Features

### Interactive Map

- Browse tap water quality data on an interactive Google Maps interface
- Click on markers to view detailed city information
- Pan and zoom to explore different locations worldwide

### City Information

- View comprehensive water quality metrics
- See official safety status and local advice
- Read community reviews and ratings
- Access technical water quality data (pH, hardness, TDS, chlorine levels)

### Review System

- Submit reviews with taste and safety ratings (1-5 scale)
- Add detailed information about water quality
- Include location-specific feedback
- Track review history through user authentication

### Search and Discovery

- Search cities by name or country
- Use geolocation to find nearby cities
- Filter results based on map viewport
- Get personalized recommendations

### User Authentication

- Sign in with GitHub or Google accounts
- Manage review submissions
- Track contribution history
- Personalized user experience

## Database Schema

The application uses the following main tables:

- **cities**: Stores city information and aggregate water quality data
- **reviews**: User-submitted reviews with ratings and detailed feedback
- **users**: User accounts managed by NextAuth
- **accounts**: OAuth provider connections
- **sessions**: User session management
- **verification_tokens**: Email verification tokens

See [DATABASE.md](DATABASE.md) for complete schema details.

## API Routes

### GET /api/cities

Fetch cities with optional filtering:

- `search`: Search by city name or country
- `minLat`, `maxLat`, `minLng`, `maxLng`: Geographic bounds
- `limit`: Maximum results (default 50, max 100)

### GET /api/cities/[id]

Fetch a specific city with its reviews.

### POST /api/reviews

Submit a new review. Requires authentication.

### GET /api/geocode

Reverse geocode coordinates to city information.

## Environment Variables

### Required

- `TURSO_DATABASE_URL`: Turso database connection URL
- `TURSO_AUTH_TOKEN`: Turso authentication token
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js session encryption
- `NEXTAUTH_URL`: Application base URL

### Optional (for full functionality)

- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: GitHub OAuth credentials
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics measurement ID (format: G-XXXXXXXXXX)
- `NEXT_PUBLIC_SITE_URL`: Production site URL (e.g., https://tapwaterrating.com)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: Google Search Console verification code

## SEO Features

The application includes comprehensive SEO optimization:

- **Meta Tags**: Complete Open Graph and Twitter Card tags for social media sharing
- **Structured Data**: JSON-LD schema markup for search engines
- **Sitemap**: Auto-generated sitemap at `/sitemap.xml`
- **Robots.txt**: Configured for optimal crawling
- **PWA Manifest**: Progressive Web App support with manifest.json
- **Canonical URLs**: Proper canonical tag implementation
- **Mobile Optimization**: Responsive design and mobile-first approach

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed on any platform that supports Next.js:

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm run start
```

Ensure all environment variables are properly configured in your deployment environment.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.
