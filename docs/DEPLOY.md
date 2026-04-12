# Deploying G-Health to Cloudflare Workers

G-Health is a serverless app using Cloudflare Workers for the API and Vite for the frontend.

## Architecture

- **Frontend**: React + Vite (static files)
- **API**: Hono + Cloudflare Workers
- **Database**: MongoDB Atlas (cloud)
- **Deployment**: Cloudflare Workers + static hosting

## Prerequisites

1. Cloudflare account
2. MongoDB Atlas account
3. Google Gemini API key
4. Bun installed

## Setup for Development

### 1. Environment Variables

Create `.env` with MongoDB and Gemini keys:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/g-health
GEMINI_API_KEY=your_key_here
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Run Locally

Two terminals:

**Terminal 1 - API Server:**
```bash
bun run dev:api
# Runs worker on http://localhost:8787
```

**Terminal 2 - Frontend:**
```bash
bun run dev
# Runs Vite on http://localhost:5173
# Proxies /api to localhost:8787
```

Visit `http://localhost:5173`

### 4. Test

```bash
bun test
```

### 5. Seed Demo Data

```bash
bun run seed
# Creates demo@example.com with 30 days of data
```

## Deployment to Cloudflare Workers

### 1. Login to Cloudflare

```bash
wrangler login
```

This opens browser for OAuth. Approve and return to terminal.

### 2. Create Wrangler Project

Update `wrangler.toml`:
- Change `name` if desired
- Add `account_id` and `zone_id` from Cloudflare dashboard

### 3. Set Secrets

```bash
wrangler secret put MONGODB_URI
# Paste MongoDB URI

wrangler secret put GEMINI_API_KEY
# Paste Gemini API key
```

### 4. Build Frontend

```bash
bun run build
# Creates dist/ folder
```

### 5. Deploy

```bash
bun run deploy
# Deploys to Cloudflare Workers
```

URL: `https://g-health.{your-subdomain}.workers.dev`

## File Structure

```
src/
├── worker.ts              # Cloudflare Workers entry
├── server/
│   ├── db.ts              # MongoDB connection
│   └── routes/
│       ├── auth.ts        # Auth endpoints
│       ├── logs.ts        # Health log endpoints
│       └── ai.ts          # Gemini AI endpoints
├── App.tsx                # React entry
└── components/            # React components

dist/                       # Built frontend (after build)
wrangler.toml              # Workers config
vite.config.ts             # Frontend build config
```

## API Endpoints

All routes are prefixed with `/api`:

- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/user/:id` - Get profile
- `PUT /auth/user/:id` - Update profile
- `GET /logs/:userId` - List health logs
- `POST /logs/:userId` - Create log
- `PUT /logs/:userId/:logId` - Update log
- `DELETE /logs/:userId/:logId` - Delete log
- `POST /logs/:userId/bulk` - Bulk upload
- `GET /logs/:userId/analytics` - Stats
- `POST /chat` - Chat with AI
- `POST /analyze-meal` - Analyze food
- `POST /generate-plan` - Generate 7-day plan

## Debugging

### Local
```bash
wrangler dev --local
# Runs worker locally without deploying
```

### Logs
```bash
wrangler tail
# Streams production logs
```

### Issues

**"Worker error"**: Check secrets are set with `wrangler secret list`

**MongoDB timeout**: Verify MONGODB_URI is correct and IP whitelist includes Workers IPs

**GEMINI_API_KEY error**: Verify key is valid at https://aistudio.google.com

## Production Notes

- Worker has cold start latency (~100ms)
- MongoDB connection reused after first request
- Environment variables loaded from Cloudflare dashboard
- No need to manage servers or scaling

## Costs

- Cloudflare Workers: 10M free requests/month
- MongoDB Atlas: Free tier available
- Gemini API: Pay per request

---

For questions, check [docs/](.) folder or create an issue.
