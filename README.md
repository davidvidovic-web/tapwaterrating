# TapWaterRating

A web application for rating and reviewing tap water quality around the world. Users can view water quality data, submit reviews, and discover safe drinking water locations through an interactive map interface.

## Overview

TapWaterRating helps travelers and residents make informed decisions about tap water safety by providing:

- Community-driven water quality ratings and reviews
- Interactive map interface for discovering locations
- Official water quality metrics (pH levels, hardness, chlorine levels, TDS)
- Location-based search and geolocation support
- User authentication via GitHub and Google OAuth
- **Content management system with AI-powered writing assistance**
- **Knowledge base for water quality information and guides**

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
- **Content Editor**: TipTap (WYSIWYG editor)
- **AI Integration**: OpenAI GPT-4o-mini
- **Notifications**: Radix UI Toast

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

# OpenAI API (for AI content generation)
OPENAI_API_KEY=your-openai-api-key

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

### Content Management (Admin)

- Create and edit blog posts and pages
- WYSIWYG editor with rich text formatting
- AI-powered content generation and optimization
- Categories and tags organization
- SEO metadata management
- Draft/publish workflow

### Knowledge Base

- Centralized hub for all content
- Search across posts and pages
- Clean, accessible layout
- Organized information architecture

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

### Cities & Reviews

- **GET /api/cities**: Fetch cities with optional filtering (search, geographic bounds, limit)
- **GET /api/cities/[id]**: Fetch a specific city with its reviews
- **POST /api/reviews**: Submit a new review (requires authentication)
- **GET /api/reviews/[id]**: Get a specific review
- **GET /api/geocode**: Reverse geocode coordinates to city information

### Content Management

- **GET /api/content/posts**: List all blog posts
- **GET /api/content/posts/[id]**: Get a specific post
- **POST /api/content/posts**: Create a new post (admin only)
- **PUT /api/content/posts/[id]**: Update a post (admin only)
- **DELETE /api/content/posts/[id]**: Delete a post (admin only)
- **GET /api/content/categories**: List all categories
- **GET /api/content/tags**: List all tags

### AI Features (Admin Only)

- **POST /api/ai/generate-metadata**: Generate SEO metadata (title, description, keywords, excerpt)
- **POST /api/ai/improve-content**: Improve, expand, simplify, or optimize content
- **POST /api/ai/generate-content**: Generate full content from a prompt

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
- `OPENAI_API_KEY`: OpenAI API key for AI content generation features

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

## Changelog

### Version 1.3.5 (January 2026)

**Major Changes:**

- **Geocoding Migration**: Replaced Google Places/Maps API with Nominatim (OpenStreetMap)
  - Free, no API key required
  - Added English language preference for international locations
  - Supports autocomplete, reverse geocoding, and place lookup
- **Map Tiles**: Switched from OpenStreetMap to CartoDB Voyager for better English labels
- **Logo & Icons**: Complete icon suite generated from vector logo
  - SVG export functionality with download button
  - Favicon, Apple Touch Icon, and PWA icons (192px, 512px)
  - Maskable icon support for Android

**User Experience Improvements:**

- Search results limited to 3 most relevant places
- Higher zoom levels for search results (street-level: 17, neighborhood: 15, city: 13)
- Fixed search bar collapse/expand behavior
- Mobile drawer now overlays map instead of resizing it
- Removed console logging from API routes for cleaner server output

**Technical Improvements:**

- Database singleton pattern to prevent Turso concurrent write errors
- Added `syncUrl` and `syncInterval` configuration for better sync performance
- TypeScript fixes for city status enum validation
- Proper handling of unrated cities (shows review form)
- Location data now embedded directly in autocomplete responses

**API Updates:**

- `/api/places/autocomplete`: Nominatim search with English preference
- `/api/places/details`: Nominatim lookup by OSM entity ID
- `/api/geocode`: Nominatim reverse geocoding with addressdetails
- All routes include `Accept-Language: en` headers and `extratags` for localized names

### Version 1.4.0 (January 2026)

**Content Management System:**

- Full WYSIWYG editor using TipTap with rich text formatting
- Content types: Posts (for blog) and Pages (for static content)
- Categories and tags system with color coding
- Draft/Published/Archived status management
- SEO metadata fields (meta title, description, keywords)
- Featured images support
- Slug auto-generation from titles
- View counter for analytics
- Content JSON storage for advanced editing

**AI-Powered Features:**

- OpenAI GPT-4o-mini integration for content generation
- AI Generate Metadata: Auto-creates SEO titles, descriptions, and keywords
- AI Improve Content: Enhances clarity, grammar, and flow
- AI Expand Content: Adds detail and elaboration
- AI SEO Optimize: Incorporates keywords naturally
- AI Generate Excerpt: Creates compelling summaries
- AI Generate Content: Full content creation from prompts
- Cost-effective implementation (~$0.003 per content generation)

**Knowledge Base:**

- Unified `/knowledge` route displaying all posts and pages
- Search functionality across all content
- Simple, clean list layout with icons
- Proper routing: posts at `/blog/[slug]`, pages at `/[slug]`
- Integrated navigation from all content back to knowledge base

**User Experience Improvements:**

- Toast notifications replacing browser alerts
- Four variants: success, error, warning, and info
- Auto-dismiss after 5 seconds with manual close option
- Swipe-to-dismiss on mobile
- Non-blocking notifications with smooth animations

**Design Updates:**

- Flat design system with removed box shadows
- Light mode with liquid glass aesthetic (backdrop-blur, transparency)
- Consistent glassmorphism across public pages
- Clean borders for element definition
- Simplified 404 page with single "Go Home" button

**Technical Fixes:**

- Fixed TipTap editor content loading with editorKey pattern
- Resolved AI-generated content not appearing in editor
- Proper 404 handling with Next.js `notFound()` function
- Editor remounting on content updates
- NextAuth v5 compatibility throughout

**SEO & Content:**

- Dynamic sitemap generation including posts and pages
- Metadata generation per post/page
- Proper canonical URLs for all content
- `/knowledge` added to sitemap
- View counting on published content

### Version 1.1.0 (January 2026)

**New Features:**

- Admin authentication system with secure login
- PWA support with custom icons and manifest
- Enhanced loading screens with professional animations
- Improved map markers with plus icons for new reviews
- Search bar with clear functionality

**Technical Improvements:**

- JWT-based authentication with NextAuth v5
- Database-backed admin user management with bcrypt encryption
- TypeScript strict mode compliance
- Enhanced error handling and type safety
- Production build optimizations

**Bug Fixes:**

- Fixed authentication flow redirects
- Resolved TypeScript compilation errors
- Improved null safety in map components
- Fixed Suspense boundary issues for server-side rendering

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
