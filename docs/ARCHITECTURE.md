# Architecture & Code Structure

## Directory Structure

```
G-Health/
├── src/
│   ├── server/
│   │   ├── db.ts              # MongoDB connection & models
│   │   └── routes/
│   │       ├── auth.ts        # Authentication endpoints
│   │       ├── logs.ts        # Health log CRUD endpoints
│   │       └── ai.ts          # AI assistant endpoints
│   ├── App.tsx                # React frontend
│   ├── components/            # React components
│   ├── services/              # Frontend services
│   ├── utils/                 # Utilities
│   └── types.ts               # TypeScript types
├── scripts/
│   └── seed-demo.ts           # Demo data seeding script
├── tests/
│   └── auth.test.ts           # Auth unit tests
├── docs/
│   ├── API.md                 # API reference
│   ├── TESTING.md             # Testing guide
│   └── ARCHITECTURE.md        # This file
├── server.ts                  # Express server entry point
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── vite.config.ts             # Vite config
```

---

## Modules

### Database (`src/server/db.ts`)

Centralized MongoDB connection management and model definitions.

**Exports:**
- `User` - User model (profile, biometrics, auth)
- `Log` - Log model (time-series health data)
- `connectDB()` - Connect to MongoDB
- `disconnectDB()` - Disconnect from MongoDB
- `isDBConnected()` - Check connection status

**Environment:**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/g-health
```

**Usage:**
```typescript
import { connectDB, User, Log } from "./src/server/db";

await connectDB();
const user = await User.findById(id);
```

---

### Routes

#### Auth Routes (`src/server/routes/auth.ts`)

User authentication and profile management.

**Endpoints:**
- `POST /auth/signup` - Create account (with biometrics)
- `POST /auth/login` - Login
- `GET /auth/user/:id` - Get user profile
- `PUT /auth/user/:id` - Update profile

**Features:**
- bcrypt password hashing (cost 10)
- Password never in responses
- Input validation

---

#### Logs Routes (`src/server/routes/logs.ts`)

Health data CRUD, filtering, and analytics.

**Endpoints:**
- `GET /logs/:userId` - List logs (filter by type, date range)
- `GET /logs/:userId/:logId` - Get single log
- `POST /logs/:userId` - Create log
- `PUT /logs/:userId/:logId` - Update log
- `DELETE /logs/:userId/:logId` - Delete log
- `POST /logs/:userId/bulk` - Bulk upsert (for demo)
- `GET /logs/:userId/analytics` - Summary stats

**Log Types:**
- `weight` - { weight: number }
- `bp` - { systolic: number, diastolic: number }
- `food` - { name: string, calories: number }
- `exercise` - { type: string, durationMinutes: number }
- `lipids` - { triglycerides, hdl, ldl, glucose }

---

#### AI Routes (`src/server/routes/ai.ts`)

AI-powered health assistance using Gemini API.

**Endpoints:**
- `POST /chat` - Chat with AI assistant
- `POST /analyze-meal` - Analyze meal for calories
- `POST /generate-plan` - Generate 7-day prevention plan

**Features:**
- User context injection (profile + recent logs)
- South Asian dietary focus
- Structured meal analysis

---

### Server Entry Point (`server.ts`)

Express server with Vite integration.

**Responsibilities:**
1. Connect to MongoDB
2. Mount API routes
3. Serve Vite dev middleware (development)
4. Serve built React app (production)
5. Handle 404s (SPA routing)

**Startup Output:**
```
🚀 Server running at http://localhost:3000
📊 MongoDB: Connected
📚 API Routes: [list]
```

---

## Data Models

### User Schema

```typescript
{
  email: string (unique, required)
  password: string (bcrypt hashed, required)
  age?: number
  gender?: 'male' | 'female' | 'other'
  height?: number (cm)
  weight?: number (kg)
  waist?: number (cm)
  systolicBP?: number
  diastolicBP?: number
  fastingGlucose?: number
  triglycerides?: number
  hdl?: number
  ldl?: number
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active'
  familyHistory?: boolean
}
```

### Log Schema

```typescript
{
  userId: ObjectId (required, ref: User)
  type: string (required) // 'weight', 'bp', 'food', 'exercise', 'lipids'
  data: any (required) // Type-specific object
  timestamp: Date (default: now)
}
```

---

## Authentication Flow

```
User Input (email, password)
    ↓
POST /api/auth/signup or /api/auth/login
    ↓
Validate input
    ↓
Hash password (bcrypt) or Compare with hash
    ↓
Return user data (password excluded)
    ↓
Frontend stores userId locally
    ↓
Use userId in subsequent API calls
```

**Security:**
- bcrypt cost 10 (slow by design)
- Random salt per password
- Password never in responses
- Stateless (no sessions)

---

## API Request/Response Pattern

### Request
```http
POST /api/logs/:userId
Content-Type: application/json

{
  "type": "weight",
  "data": { "weight": 85.5 },
  "timestamp": "2024-02-01T07:00:00Z"
}
```

### Response (Success)
```http
201 Created
Content-Type: application/json

{
  "log": {
    "_id": "log123",
    "userId": "user123",
    "type": "weight",
    "data": { "weight": 85.5 },
    "timestamp": "2024-02-01T07:00:00Z"
  }
}
```

### Response (Error)
```http
400 Bad Request
Content-Type: application/json

{
  "error": "Type and data required"
}
```

---

## Demo Data Seeding

Script: `scripts/seed-demo.ts`

```bash
bun run seed
```

**Creates:**
- User: demo@example.com / demo123
- 30 days of realistic health data
  - Daily meals (3/day)
  - Exercise 4x/week
  - BP 2-3x/week (trending down)
  - Weight every 3 days (trending down)
  - Biweekly lipids

**Process:**
1. Connect to MongoDB
2. Find or create demo user
3. Clear existing logs
4. Generate 30 days of data with realistic patterns
5. Bulk upsert all logs
6. Disconnect

---

## Testing

**Framework:** Bun test runner with MongoDB Memory Server

**File:** `tests/auth.test.ts`

**Coverage:** 25 tests
- Signup (6): hashing, biometrics, duplicates
- Login (5): verification, invalid creds
- Fetch (3): by ID, 404, password exclusion
- Update (5): profile, partial, hash preservation
- Security (6): bcrypt format, timing resistance

**Run:**
```bash
bun test
```

**Key Features:**
- In-memory MongoDB (no external DB)
- Each test gets fresh DB state
- Password security verified
- Edge cases covered

---

## Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Gemini API
GEMINI_API_KEY=your_api_key_here
```

See `.env.example` for template.

---

## Development Workflow

```bash
# Install dependencies
bun install

# Start dev server (http://localhost:3000)
bun run dev

# Run tests
bun test

# Run lint
bun run lint

# Seed demo data
bun run seed

# Build for production
bun run build

# Start production server
bun run start
```

---

## Performance Considerations

1. **Database Indexes:** Logs indexed by (userId, timestamp, type)
2. **Bulk Operations:** Bulk upsert for efficient demo data loading
3. **Connection Pooling:** Mongoose manages connection pool
4. **Query Limits:** Analytics query limited to 1000 recent logs
5. **Pagination:** Logs endpoint supports limit/skip

---

## Security

✅ **Password:** bcrypt (cost 10, timing-resistant)
✅ **API:** Stateless (no sessions/cookies)
✅ **Input:** Basic validation on all endpoints
✅ **CORS:** Open (configure as needed)
✅ **Secrets:** MongoDB URI & API key in .env only

---

## Future Improvements

- [ ] Add input validation library (zod, joi)
- [ ] Add rate limiting middleware
- [ ] Add logging middleware (morgan)
- [ ] Add error handling middleware
- [ ] Migrate to TypeScript classes/services
- [ ] Add request/response types
- [ ] Add OpenAPI/Swagger docs
- [ ] Add JWT tokens for stateless auth
