# Database Setup

## Prerequisites

1. **Install Turso CLI**
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **Login to Turso**
   ```bash
   ~/.turso/turso auth login
   ```

## Setup Steps

### 1. Create Database (if not exists)
```bash
turso db create canidrinkit
```

### 2. Get Database URL and Create Token
```bash
# Get database URL
turso db show canidrinkit

# Create auth token
turso db tokens create canidrinkit
```

### 3. Configure Environment
Create a `.env.local` file in the `web/` directory:

```env
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_MAPTILER_API_KEY=
```

### 4. Apply Schema
```bash
cd web
npm run db:generate  # Generate migration SQL
npm run db:push      # Apply to database (or use turso CLI if auth issues)
```

If `db:push` has authentication issues, apply migrations directly:
```bash
~/.turso/turso db shell canidrinkit < drizzle/0000_*.sql
```

### 5. Seed Initial Data
```bash
npm run db:seed
```

## Verify Data

Using Turso CLI:
```bash
# List tables
~/.turso/turso db shell canidrinkit ".tables"

# Query cities
~/.turso/turso db shell canidrinkit "SELECT id, name, country FROM cities"

# Query reviews
~/.turso/turso db shell canidrinkit "SELECT id, city_id, user_id, taste_rating FROM reviews"
```

Using Turso Dashboard:
1. Visit https://turso.tech/dashboard
2. Select your database
3. Use the SQL editor to query data

## Available Scripts

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed initial data (cities, users, reviews)

## Schema Overview

- **cities** - City water quality data (3 seed cities: Barcelona, Mexico City, Singapore)
- **users** - User accounts (via NextAuth)
- **reviews** - User-submitted water quality reviews
- **helpful_votes** - Review helpfulness tracking
- **accounts** - OAuth account links (NextAuth)
- **sessions** - User sessions (NextAuth)
- **verification_tokens** - Email verification (NextAuth)
