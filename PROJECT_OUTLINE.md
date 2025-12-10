# Can I Drink It? - Project Outline

## 📋 Project Overview

**Can I Drink It?** is an interactive world map application that helps travelers and residents determine if tap water is safe to drink in their city. The application provides comprehensive information about water quality, taste, and safety recommendations.

---

## 🎯 Core Objectives

1. **Safety First**: Provide reliable, up-to-date information about tap water drinkability worldwide
2. **User-Friendly**: Make complex water quality data accessible through beautiful visualizations
3. **Community-Driven**: Allow users to contribute their experiences and ratings
4. **Mobile-Ready**: Ensure the application works seamlessly on all devices, especially mobile

---

## ✨ Key Features

### 1. Interactive World Map

- **Visual Heat Map**: Color-coded regions showing water safety levels
  - 🟢 Green: Safe to drink
  - 🟡 Yellow: Drinkable but may taste different
  - 🟠 Orange: Use caution, filtering recommended
  - 🔴 Red: Not safe to drink
- **Zoom & Navigation**: Intuitive map controls to explore different regions
- **Search Functionality**: Debounced, rate-limited autocomplete against a curated city catalog (with cached Nominatim fallback)
- **Location Detection**: Auto-detect user's current location

### 2. City/Region Information Panel

When a user selects a location, display:

- **Safety Rating**: Overall drinkability score (1-10)
- **Official Status**: Government/WHO recommendations
- **Community Metrics** (aggregated from user reports):
  - pH Level
  - Chlorine content
  - Hardness (soft/medium/hard)
  - TDS (Total Dissolved Solids)
  - Contaminant levels
- **Taste Profile**: Community ratings on taste
- **Source Information**: Where the water comes from (reservoir, river, groundwater, etc.)
- **Treatment Process**: Basic info on purification methods used
- **Last Updated**: Date of the most recent data

### 3. User Reviews & Ratings

- **Community Reviews**: User-submitted experiences
- **Taste Ratings**: 5-star system for taste quality
- **Water Quality Reports**: Users can optionally report technical metrics (pH, hardness, etc.)
- **Tips & Recommendations**: Local advice (e.g., "Tastes better cold", "Use a filter")
- **Verified Travelers**: Badge system for frequent contributors

### 4. Practical Information

- **Filter Recommendations**: Suggested water filters for the region
- **Bottled Water Costs**: Average local prices for bottled water
- **Local Phrases**: How to ask for tap water in the local language
- **Alternatives**: Where to find safe drinking water (fountains, refill stations)

### 5. Comparison Tool

- **Multi-City Comparison**: Compare water quality across different cities (hard cap: 3 cities per compare)
- **Travel Planning**: Check water safety for upcoming destinations
- **Historical Data**: See how water quality has changed over time (paged, capped ranges)

## 🏗️ Technical Architecture

### Frontend

- **Framework**: Next.js 14+ with App Router
- **Mapping Library**: MapLibre GL JS (open-source)
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context or SWR
- **Data Visualization**: Chart.js for water quality graphs

### Backend

- **API Framework**: Next.js API routes (serverless)
- **Database**: Turso (LibSQL - distributed SQLite at the edge)
- **ORM**: Drizzle ORM (type-safe database queries)
- **Authentication**: NextAuth.js v5 (for user reviews/contributions)

### Data Sources

- **Official Sources**:
  - WHO (World Health Organization) water quality database
  - CDC (Centers for Disease Control) travel recommendations
  - Local government water quality reports
  - European Environment Agency (for Europe)
- **Crowdsourced Data**: User reviews and ratings
### APIs & Integrations

- **Geolocation API**: Browser geolocation for auto-detection
- **Geocoding**: Curated city catalog + cached, rate-limited Nominatim fallback for city search
- **Map Tiles**: MapTiler or Mapbox for base map styling with tile caching and usage caps

---

## 🎨 User Experience Flow

### First-Time Visitor

1. Land on homepage with world map displayed
2. See brief onboarding tooltip: "Search or click any city to check water safety"
3. Option to allow location detection for instant results
4. Explore map or use search

### Searching for a City

1. Type city name in search bar
2. See autocomplete suggestions (debounced, curated list; cached Nominatim fallback) with country flags
3. Click suggestion → map animates to location
4. Information panel slides in from right with water quality data
5. Scroll down to see community reviews and ratings

### Contributing a Review

1. Click "Add Review" button on city panel
2. Sign in/create account (social login options)
3. Rate water on multiple factors:
   - Safety (safe/unsafe)
   - Taste (1-5 stars)
   - Add written review (optional)
   - **Report Metrics** (optional): pH, hardness, source info
4. Submit → Thank you message
5. Review appears after moderation (or instantly with verification badge)

### Mobile Experience

- Bottom sheet design for information panel
- Swipe gestures for navigation
- Offline mode for saved cities (limited slots, background sync capped)
- Share functionality to send recommendations

---

## 📊 Data Structure

### City Water Data Model

```javascript
{
  id: "uuid",
  cityName: "Barcelona",
  country: "Spain",
  countryCode: "ES",
  coordinates: {
    lat: 41.3851,
    lng: 2.1734
  },
  safetyRating: 8.5,
  officialStatus: "safe",
  waterQuality: {
    pH: 7.8,
    chlorine: 0.5, // mg/L
    hardness: "hard",
    tds: 320, // mg/L
    contaminants: []
  },
  tasteRating: 6.2, // community average
  source: "Ter and Llobregat rivers",
  treatment: "Conventional treatment with chlorination",
  lastUpdated: "2025-12-01",
  reviewCount: 1247,
  userRatings: {
    safety: 4.2,
    taste: 3.1,
    overall: 3.8
  }
}
```

### User Review Model

```javascript
{
  id: "uuid",
  cityId: "city-uuid",
  userId: "user-uuid",
  userName: "John Doe",
  verified: true,
  ratings: {
    safety: 4,
    taste: 3
  },
  // Optional user-reported metrics
  reportedMetrics: {
    pH: 7.5,
    hardness: "hard",
    source: "Tap"
  },
  review: "Water is safe but has a strong chlorine taste...",
  helpful: 45, // helpful vote count
  createdAt: "2025-11-15",
  visitDate: "2025-11-01"
}
```

---

## 🚀 Development Phases

### Phase 1: MVP (Minimum Viable Product)

**Timeline: 4-6 weeks**

- Basic world map with 50-100 major cities
- Simple color-coding (safe/unsafe)
- City information panel with essential data
- Search functionality
- Responsive design
- Static data (no user contributions yet)

### Phase 2: Community Features

**Timeline: 3-4 weeks**

- User authentication
- Review submission system
- Rating aggregation
- Review moderation tools

### Phase 3: Enhanced Data & Features

**Timeline: 4-6 weeks**

- Expand to 500+ cities
- Detailed water quality metrics
- Historical data tracking
- Comparison tool
- Filter recommendations
- Offline mode for mobile

### Phase 4: Advanced Features

**Timeline: 6-8 weeks**

 - Multi-language support

---

## 🎯 Success Metrics

### User Engagement

- Daily Active Users (DAU)
- Cities searched per session
- Review submission rate
- Return visitor rate

### Data Quality

- City coverage (target: 1000+ cities)
- Review freshness (avg age of reviews)
- Data accuracy (validated against official sources)

### Performance

- Page load time < 2 seconds
- Map interaction lag < 100ms
- Mobile performance score > 90 (Lighthouse)

---

## 🚧 Potential Challenges & Solutions

### Challenge 1: Data Accuracy & Freshness

**Problem**: Water quality can change; keeping data current is crucial
**Solutions**:

- Partner with local water authorities for official data
- Implement data expiration warnings
- Community flagging system for outdated info
- Automated scraping of official sources (with permission)

### Challenge 2: Data Coverage

**Problem**: Comprehensive global data is difficult to obtain
**Solutions**:

- Start with major tourist destinations
- Crowdsource data from travelers
- Prioritize cities based on user demand
- Use WHO/CDC data as baseline

### Challenge 3: Liability Concerns

**Problem**: Users may get sick and blame the app
**Solutions**:

- Clear disclaimers on every page
- Multiple data sources with citations
- Conservative safety ratings (err on side of caution)
- Terms of service with limitation of liability
- Encourage users to verify with local authorities

### Challenge 4: Review Quality & Spam

**Problem**: Fake or unhelpful reviews can damage credibility
**Solutions**:

- Require authentication for reviews
- Verification system for frequent travelers
- Community moderation (helpful/not helpful votes)
- AI-powered spam detection
- Moderator review queue

### Challenge 5: Monetization

**Problem**: Sustaining the project long-term
**Solutions**:

- Affiliate links for water filters/bottles
- API access for travel companies
- Sponsored content (clearly labeled)
- Donations from community

---

## 🌍 Target Audience

### Primary Users

1. **International Travelers**: Tourists visiting foreign countries
2. **Digital Nomads**: People living/working in different cities
3. **Expatriates**: People relocating to new countries
4. **Backpackers**: Budget travelers concerned about water costs

### Secondary Users

1. **Travel Planners**: Agencies planning group trips
2. **Health-Conscious Individuals**: People monitoring water quality at home
3. **Environmental Researchers**: Tracking global water quality trends
4. **Parents**: Families traveling with children

---

## 💡 Future Expansion Ideas

1. **Water Fountain Map**: Locate public drinking fountains worldwide
2. **Refill Station Network**: Partner with cafes/businesses offering free refills
3. **Carbon Footprint Tracker**: Show environmental impact of choosing tap vs. bottled
4. **Water Quality Testing**: Partner with testing kit companies
5. **Educational Content**: Blog posts about water treatment, safety, etc.
6. **Language Learning**: Teach water-related phrases in different languages
7. **Hotel Integration**: Show water safety for specific hotels
8. **Restaurant Recommendations**: Find places that serve filtered water
9. **Emergency Preparedness**: Natural disaster water safety info
10. **AR Features**: Point camera at tap to see instant safety info

---

## 📱 Marketing Strategy

### Launch Strategy

1. **Beta Testing**: Private beta with travel bloggers/influencers
2. **Social Media**: Instagram/TikTok with stunning map visualizations
3. **Reddit**: Post in r/travel, r/digitalnomad, r/backpacking
4. **Travel Blogs**: Guest posts about water safety
5. **Press Release**: Target travel and tech publications

### Growth Tactics

1. **SEO**: Target keywords like "is tap water safe in [city]"
2. **Content Marketing**: City-specific guides
3. **Partnerships**: Collaborate with travel apps (TripAdvisor, Lonely Planet)
4. **User Referrals**: Incentivize sharing
5. **App Store Optimization**: For mobile apps

---

## 🔒 Privacy & Security

### User Data Protection

- GDPR compliance for European users
- Clear privacy policy
- Minimal data collection
- Option to contribute anonymously
- Secure authentication (OAuth 2.0)
- Encrypted data transmission (HTTPS)

### Content Moderation

- Review flagging system
- Admin moderation panel
- Appeals process for removed content
- Automated profanity filtering

---

## 📄 Legal Considerations

1. **Terms of Service**: Clear usage guidelines
2. **Privacy Policy**: Transparent data practices
3. **Disclaimer**: Not medical/health advice
4. **Copyright**: User-generated content rights
5. **DMCA**: Process for copyright claims
6. **Accessibility**: WCAG 2.1 compliance
7. **International Laws**: Compliance with local regulations

---

## 🎨 Design Principles

1. **Clarity Over Complexity**: Information should be instantly understandable
2. **Mobile-First**: Most users will access on phones while traveling
3. **Visual Hierarchy**: Safety rating most prominent, details secondary
4. **Trustworthy Design**: Professional, clean, credible appearance
5. **Accessible**: Works for users with disabilities
6. **Fast**: No unnecessary animations that slow down experience
7. **Delightful**: Small touches that make users smile

---

## 🛠️ Tech Stack

### Confirmed Stack

```
Frontend:
- Next.js 14+ (React framework with App Router)
- TypeScript (type safety)
- MapLibre GL JS (open-source maps)
- Tailwind CSS (rapid styling)
- shadcn/ui (component library)
- SWR (data fetching)

Backend:
- Next.js API Routes (serverless functions)
- Turso (LibSQL - distributed SQLite)
- Drizzle ORM (type-safe database access)
- NextAuth.js v5 (authentication)

Infrastructure:
- Vercel (hosting & deployment)
- Turso Cloud (edge database)
- MapTiler or Mapbox (map tiles)
- Nominatim (geocoding - OSM)

Development Tools:
- ESLint + Prettier (code quality)
- Drizzle Kit (database migrations)
- TypeScript strict mode
- GitHub Actions (CI/CD)
```

---

## 📝 Next Steps

1. **Validate Concept**: Research existing solutions, identify gaps
2. **Data Research**: Identify reliable water quality data sources
3. **Design Mockups**: Create wireframes and high-fidelity designs
4. **Technology Decisions**: Finalize tech stack based on budget/skills
5. **MVP Development**: Build Phase 1 features
6. **Beta Testing**: Test with small group of travelers
7. **Launch**: Public release with marketing push
8. **Iterate**: Gather feedback and improve

---

## 📚 Resources & Inspiration

### Similar Apps/Websites (Competition Analysis)

- Can I Drink The Water (canidriknthewater.org)
- CDC Travel Health Notices
- TripAdvisor City Forums
- WikiVoyage Water Quality Info

### Design Inspiration

- Airbnb (clean, trustworthy design)
- Strava (activity maps, heat maps)
- Uber (location-based interface)
- Weather apps (data visualization)

### Data Sources to Explore

- WHO Global Health Observatory
- CDC Traveler's Health
- European Environment Agency (EEA)
- Local water utility websites
- Academic water quality databases

---

**Last Updated**: December 7, 2025  
**Version**: 1.0  
**Status**: Planning Phase
