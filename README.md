# PowerSync POS Demo

A demo offline-first, web-based, Point of Sale system built with React, PowerSync, and Supabase. 

## Stack

- **Frontend**: React 19 with TypeScript
- **Routing**: [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/overview)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
- **State Management**: [TanStack DB Collections](https://tanstack.com/db/latest/docs/collections/powersync-collection) with the [PowerSync Web SDK](https://docs.powersync.com/client-sdk-references/javascript-web)
- **Source Database**: [Supabase](https://supabase.com/docs) (PostgreSQL)
- **Build Tool**: [Vite](https://vite.dev/guide/)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a copy of the `.env.local.template` file in the root directory:

```bash
cp .env.local.template .env.local
```

### 3. Start Supabase

Start the local Supabase instance:

```bash
pnpm dev:supabase
```

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

Make sure to restart the local Supabase instance for the new singing keys to take affect.

### 6. Start PowerSync

1. Start the PowerSync container:
```bash
pnpm dev:powersync:start
```

   > **Note**: The PowerSync container joins the Supabase Docker network (`supabase_network_powersync`) to communicate with Supabase services. The JWKS endpoint is accessed via `supabase_kong_powersync:8000` internally.

4. Update your `.env.local` for the frontend:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your_local_publish_key
VITE_POWERSYNC_URL=http://127.0.0.1:8080
```

5. To stop or restart the PowerSync container run
```bash
# Stop the PowerSync Container
pnpm dev:powersync:stop

# Start the PowerSync Container
pnpm dev:powersync:start
```

### 7. Start Development Server

```bash
pnpm dev:ui
```

The app will be available at `http://localhost:5173`

## Database Schema

The POS system uses the following tables:

- **cashiers**: Staff members with PIN authentication
- **categories**: Product categories for catalog organization
- **products**: Product catalog with pricing and inventory
- **sales**: Sales transaction headers
- **sale_items**: Line items for each sale

## Demo Credentials

For demo/development purposes, the following PINs are available:
- `1234` - Demo Cashier
- `5678` - John Smith
- `9012` - Jane Doe

## Demo Flow

- Enter any 4-digit PIN to log in as a demo cashier (see login screen for options)
- Add items to the cart
- Complete orders
- View real-time sales updates (if other cashiers are creating orders)
- View sales history (historic sales data)

## Template
This demo used the [vite-react-is-powersync-supabase](https://github.com/powersync-community/vite-react-ts-powersync-supabase) template as the base.