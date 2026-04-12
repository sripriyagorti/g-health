<div align="center">
<img width="1200" height="300" alt="G-Health" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# G-Health: Cardiometabolic Risk Prevention Platform

AI-powered health companion for tracking and preventing Type 2 Diabetes, Hypertension, and Cardiovascular Disease in South Asian adults.

[Features](#features) • [Quick Start](#quick-start) • [Demo Data](#demo-data) • [API](#api) • [Testing](#testing)

</div>

---

## Features

### 📊 Risk Assessment
- Personalized risk scoring for diabetes, hypertension, and CVD
- Real-time BMI & derived metrics calculation
- Biometric data tracking (weight, BP, glucose, lipids, waist)

### 🤖 AI Assistant
- Chat with AI for personalized health advice
- Meal analysis & calorie estimation from food descriptions
- Generate 7-day prevention plans based on profile
- Function-calling for structured data logging

### 📈 Health Tracking
- Daily logging: meals, exercise, vitals
- 30-day progress analytics & trends
- Weight loss tracking & BP improvement monitoring
- Lab result history (glucose, triglycerides, HDL/LDL)

### 🔐 Security
- bcrypt password hashing (cost 10)
- No password exposed in API responses
- Timing-attack resistant authentication

### ⚡ API-First Architecture
- Full CRUD APIs for health data
- Bulk upsert for demo/automation
- Filtering, pagination, analytics endpoints
- Ready for mobile/third-party integrations

---

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- MongoDB (local or Atlas)
- Gemini API key

### Install
```bash
git clone <repo>
cd g-health
bun install
```

### Setup
```bash
# Copy environment
cp .env.example .env

# Add your keys:
# GEMINI_API_KEY=your_key_here
# MONGODB_URI=your_mongodb_uri
```

### Run

**Local Development** (two terminals):

Terminal 1 - API server:
```bash
bun run dev:api
# Worker runs on http://localhost:8787
```

Terminal 2 - Frontend:
```bash
bun run dev
# Vite runs on http://localhost:5173
# API proxies to localhost:8787
```

**Tests:**
```bash
bun test
```

**Seed demo account:**
```bash
bun run seed
```

**Production:**
```bash
bun run build              # Build React app to dist/
bun run deploy             # Deploy to Cloudflare Workers
```

See [docs/DEPLOY.md](docs/DEPLOY.md) for deployment details.

---

## Demo Data

Create a demo account with 30 days of realistic health data:

```bash
bun run seed
```

**Creates:**
- Email: `demo@example.com`
- Password: `demo123`
- 30 days of data:
  - ✓ Daily meals (3/day, ~400-500 kcal each)
  - ✓ Exercise 4x/week (walking, cycling, yoga, running)
  - ✓ BP measurements 2-3x/week (trending down)
  - ✓ Weight every 3 days (trending down)
  - ✓ Biweekly lab results

Use this for testing, demoing, or understanding data structure.

---

## API

Full CRUD API for health data logging & automation.

### Base URL
```
http://localhost:3000/api
```

### Key Endpoints

**Logs (CRUD)**
- `GET /logs/:userId` - List logs (filter by type, date range)
- `POST /logs/:userId` - Create log
- `PUT /logs/:userId/:logId` - Update log
- `DELETE /logs/:userId/:logId` - Delete log
- `POST /logs/:userId/bulk` - Bulk upsert (for demo data)
- `GET /logs/:userId/analytics` - Summary stats

**Auth**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/user/:id` - Get profile
- `PUT /api/user/:id` - Update profile

**AI**
- `POST /api/chat` - Chat with AI assistant
- `POST /api/analyze-meal` - Analyze meal for calories
- `POST /api/generate-plan` - Generate 7-day prevention plan

See [docs/API.md](docs/API.md) for complete reference with examples.

### Example: Create Demo Programmatically
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","age":45,"weight":85,...}'

# Get user ID from response, then bulk load data
curl -X POST http://localhost:3000/api/logs/{userId}/bulk \
  -H "Content-Type: application/json" \
  -d '{"logs":[{type:"weight",data:{weight:85.5},timestamp:"2024-01-01T07:00:00Z"},...]}' 
```

---

## Testing

### Unit Tests
```bash
bun test
```

**Coverage:** 25 tests across auth (signup, login, fetch, update, security)
- Password hashing & bcrypt verification
- Invalid credentials rejection
- Timing attack resistance
- Password exclusion from API

**Infrastructure:** MongoDB Memory Server (no external DB needed)

See [docs/TESTING.md](docs/TESTING.md) for details.

---

## Architecture

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **Recharts** for analytics
- **Motion** for animations
- **Lucide React** for icons

### Backend (Serverless)
- **Cloudflare Workers** - Serverless API
- **Hono** - Lightweight web framework
- **MongoDB Atlas** - Cloud database
- **Gemini 2.5 Flash** for AI
- **bcrypt** for password hashing

**No servers to manage.** Deploy with `bun run deploy`.

### Data Models
- **User**: Profile, biometrics, auth
- **Log**: Time-series health data (weight, BP, food, exercise, lipids)

### Auth
- Email/password signup
- bcrypt password hashing (cost 10)
- Session-less (stateless API)

### AI
- Gemini function calling for structured logging
- Image recognition for meal analysis
- High-reasoning mode for prevention plans

---

## UI Flow

```
Onboarding
    ↓
Signup/Login
    ↓
Health Assessment (new users only)
    ↓
Dashboard (home screen)
    ├─ Summary metrics
    ├─ Quick action cards
    └─ Personalized plan button
    ↓
Navigation (Bottom nav on mobile, sidebar on desktop)
├─ Home (Dashboard)
├─ Daily Log (nutrition, exercise, vitals)
├─ Analytics (trends over time)
├─ AI Chat (ask questions, get advice)
└─ Profile (health assessment)
```

---

## Health Calculations

### Risk Scoring
- **Diabetes Risk**: FPG, BMI, waist, weight trend, activity
- **Hypertension Risk**: BP, BMI, weight trend, activity
- **CVD Risk**: Diabetes risk + Hypertension risk + age factor

### Derived Metrics (7-30 day rolling)
- Weight slope: % change per month
- Activity: Minutes in past 7 days (goal: 150)
- Avg calories: Per day in past 7 days (goal: 2200)
- Avg BP: Systolic/diastolic in past 14 days

---

## Docs

- [API.md](docs/API.md) - Complete API reference with examples
- [TESTING.md](docs/TESTING.md) - Test coverage & infrastructure
- [.env.example](.env.example) - Environment variables template

---

## Development

### Scripts
```bash
bun run dev          # Frontend dev (localhost:5173, proxies /api to 8787)
bun run dev:api      # API server (localhost:8787)
bun run build        # Build React for production
bun run deploy       # Deploy to Cloudflare Workers
bun run test         # Run all tests
bun run seed         # Seed demo account
bun run lint         # Type check
```

### Tech Stack
- **Runtime**: Bun + Cloudflare Workers
- **Language**: TypeScript
- **Frontend**: React 19 + Vite + Tailwind
- **Backend**: Hono + Cloudflare Workers (serverless)
- **Database**: MongoDB Atlas (native driver)
- **Auth**: bcrypt (cost 10)
- **AI**: Google Gemini 2.5 Flash
- **Testing**: Bun test + MongoDB Memory Server

---

## Data Privacy

- Passwords hashed with bcrypt (never stored plaintext)
- Password never exposed in API responses
- Session-less API (no cookies/tokens to steal)
- User data only accessible with correct email/password
- No tracking or analytics

---

## Limitations & Future

### Current
- Auth is email/password (stateless)
- No multi-factor authentication
- No data export/backup
- Demo data seeding only via CLI

### Roadmap
- [ ] OAuth (Google, Apple Sign-In)
- [ ] Mobile app (React Native)
- [ ] Wearable integration (Apple Health, Google Fit)
- [ ] Notifications for health goals
- [ ] Doctor sharing/telemedicine
- [ ] Clinical trial integration

---

## Support

- **Issues**: GitHub Issues
- **Feedback**: GitHub Discussions
- **Docs**: See `/docs` folder

---

## License

MIT

---

## Acknowledgments

Built for South Asian adults at high cardiometabolic risk. 

*Disclaimer: G-Health is for informational purposes only. Always consult with a healthcare professional before making medical decisions.*
