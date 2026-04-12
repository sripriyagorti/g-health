# G-Health API Reference

Complete CRUD API for health data logging and management.

## Base URL
```
http://localhost:3000/api
```

---

## Authentication

All endpoints require a valid user ID. Get this from signup/login response.

---

## Logs Endpoints

### List Logs
Get all logs for a user with optional filtering.

```http
GET /logs/:userId
```

**Query Parameters:**
- `type` (optional) - Filter by log type: `weight`, `bp`, `food`, `exercise`, `lipids`
- `startDate` (optional) - ISO date string (e.g., `2024-01-01`)
- `endDate` (optional) - ISO date string
- `limit` (optional, default 100) - Max results
- `skip` (optional, default 0) - Pagination offset

**Example:**
```bash
GET /logs/userId?type=weight&startDate=2024-01-01&endDate=2024-02-01&limit=50
```

**Response:**
```json
{
  "logs": [
    {
      "_id": "log123",
      "userId": "user123",
      "type": "weight",
      "data": { "weight": 85.5 },
      "timestamp": "2024-02-01T07:00:00Z"
    }
  ],
  "total": 25,
  "count": 20
}
```

---

### Get Single Log
Retrieve a specific log entry.

```http
GET /logs/:userId/:logId
```

**Response:**
```json
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

---

### Create Log
Create a new log entry.

```http
POST /logs/:userId
```

**Body:**
```json
{
  "type": "weight",
  "data": { "weight": 85.5 },
  "timestamp": "2024-02-01T07:00:00Z"
}
```

**Required Fields:**
- `type` - Log type (weight, bp, food, exercise, lipids)
- `data` - Object with type-specific data
- `timestamp` (optional) - Defaults to now

**Response:** `201 Created`

---

### Update Log
Update an existing log entry.

```http
PUT /logs/:userId/:logId
```

**Body:**
```json
{
  "data": { "weight": 84.8 }
}
```

---

### Delete Log
Delete a log entry.

```http
DELETE /logs/:userId/:logId
```

---

### Bulk Upsert Logs
Create or update multiple logs at once. Perfect for demo data.

```http
POST /logs/:userId/bulk
```

**Body:**
```json
{
  "logs": [
    {
      "type": "weight",
      "data": { "weight": 85.5 },
      "timestamp": "2024-02-01T07:00:00Z"
    }
  ]
}
```

---

### Get Analytics
Get summary statistics for user's logs.

```http
GET /logs/:userId/analytics
```

---

## Demo Data

Quickly populate a demo account with 30 days of realistic data:

```bash
bun run seed
```

Creates:
- Email: demo@example.com
- Password: demo123
- 30 days of health data (weight, BP, meals, exercise, lipids)
