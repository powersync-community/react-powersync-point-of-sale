# PowerSync POS Demo

A modern, offline-first Point of Sale system built with React, PowerSync, and Supabase. Designed for retail stores with local-first capabilities for seamless operation even without internet connectivity.

## Features

- **PIN-Based Authentication**: Quick cashier login with 4-digit PIN
- **Product Catalog**: Browse products by category with search functionality
- **Shopping Cart**: Add products, adjust quantities, and view running totals
- **Checkout Process**: Simple "Mark as Paid" workflow for completing sales
- **Sales History**: View completed transactions with detailed breakdowns
- **Offline-First**: Works offline and syncs when connectivity is restored
- **Real-time Sync**: Data automatically synchronizes across devices via PowerSync

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS v4 with custom dark theme
- **State Management**: TanStack DB Collections with PowerSync
- **Database**: PowerSync (local SQLite) + Supabase (PostgreSQL)
- **Build Tool**: Vite

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_POWERSYNC_URL=your_powersync_url
```

### 3. Set Up Supabase

Run the migration to create the necessary tables:

```bash
supabase db push
```

Or apply the migration manually from `supabase/migrations/20250103000000_pos_tables.sql`.

### 4. Configure Supabase Authentication

Enable anonymous sign-ins in your Supabase project:
1. Go to Authentication > Providers
2. Enable "Anonymous Sign-ins"

### 5. Configure JWT Signing Keys (RS256)

PowerSync requires RS256 JWT signing keys to verify tokens from Supabase. For local development, you need to configure custom signing keys.

#### Generate RS256 Signing Keys

1. Generate an RSA key pair using the Supabase CLI.

   ```bash
   supabase gen signing-key --algorithm RS256
   ```

2. Configure Supabase to use the signing keys by ensuring `supabase/config.toml` has:

   ```toml
   [auth]
   # Path to JWT signing key. DO NOT commit your signing keys file to git.
   signing_keys_path = "./signing_keys.json"
   ```

> **Important**: Add `signing_keys.json` to your `.gitignore` to avoid committing secrets to version control.

#### Configure PowerSync for JWKS Authentication

The `powersync/powersync.yaml` file is configured to authenticate using Supabase's JWKS endpoint:

```yaml
client_auth:
  # Disable the built-in Supabase auth (we use custom JWKS)
  supabase: false
  
  # JWKS URL where PowerSync fetches the public keys to verify JWTs
  # For local development, use the container hostname
  jwks_uri: 
    - http://supabase_kong_powersync:8000/auth/v1/.well-known/jwks.json
  
  # The audience claim that must be present in the JWT
  # Supabase tokens include 'authenticated' as the audience
  audience: ['authenticated']
```

**Key configuration options:**

| Option | Description |
|--------|-------------|
| `supabase: false` | Disables PowerSync's built-in Supabase integration to use custom JWKS |
| `jwks_uri` | URL(s) to fetch JSON Web Key Sets for token verification |
| `audience` | Required audience claim(s) in the JWT. Supabase uses `authenticated` |

**JWKS URL formats:**
- **Local development**: `http://supabase_kong_powersync:8000/auth/v1/.well-known/jwks.json`
- **Supabase Cloud**: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`

### 6. Set Up PowerSync

#### Option A: PowerSync Cloud
1. Create a PowerSync instance connected to your Supabase database
2. Apply the sync rules from `sync-rules.yaml`
3. Update the `VITE_POWERSYNC_URL` with your PowerSync endpoint

#### Option B: Local PowerSync with Docker

To run PowerSync locally alongside local Supabase:

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Create a `.env.local` file in the project root with the following configuration:
   ```env
   # PowerSync connects to Supabase containers via Docker network
   # Use container hostnames (not localhost) for container-to-container communication
   PS_POSTGRESQL_URI=postgresql://postgres:postgres@supabase_db_powersync:5432/postgres
   PS_API_TOKEN=your_api_token_here
   ```

3. Start the PowerSync container:
   ```bash
   cd powersync
   docker compose up -d
   ```

   > **Note**: The PowerSync container joins the Supabase Docker network (`supabase_network_powersync`) to communicate with Supabase services. The JWKS endpoint is accessed via `supabase_kong_powersync:8000` internally.

4. Update your `.env` for the frontend:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=your_local_publish_key
   VITE_POWERSYNC_URL=http://127.0.0.1:8080
   ```

### 7. Start Development Server

```bash
pnpm dev:ui
```

The app will be available at `http://localhost:5173`

## Demo Mode

The app works in demo mode without a configured backend:
- Enter any 4-digit PIN to log in as a demo cashier
- Products and categories won't appear (no data synced)
- Sales can be created but won't persist after refresh

## Project Structure

```
src/
├── components/
│   ├── auth/          # PIN login screen
│   ├── cart/          # Shopping cart sidebar
│   ├── catalog/       # Product catalog & categories
│   ├── checkout/      # Checkout flow
│   ├── sales/         # Sales history
│   └── ui/            # Reusable UI components
├── collections/       # TanStack DB collections
├── contexts/          # React contexts (auth, cart)
├── lib/               # Utility functions
├── powersync/         # PowerSync configuration
└── routes/            # TanStack Router routes
```

## Database Schema

The POS system uses the following tables:

- **cashiers**: Staff members with PIN authentication
- **categories**: Product categories for catalog organization
- **products**: Product catalog with pricing and inventory
- **sales**: Sales transaction headers
- **sale_items**: Line items for each sale

## Available Scripts

- `pnpm dev:ui` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm type-check` - Run TypeScript type checking
- `pnpm lint` - Run ESLint

## Demo Credentials

For demo/development purposes, the following PINs are available:
- `1234` - Demo Cashier
- `5678` - John Smith
- `9012` - Jane Doe

## License

MIT
