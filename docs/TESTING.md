# Testing Guide

## Run Tests

```bash
bun test
```

## Coverage

25 tests across 5 categories:
- **Signup** (6): password hashing, biometrics, duplicates
- **Login** (5): bcrypt verification, invalid creds, timing resistance
- **Fetch** (3): by ID, 404 handling, password exclusion
- **Update** (5): profile updates, partial updates, password preservation
- **Security** (6): bcrypt format, plaintext safety, timing attacks

## Key Features

✅ **Password Security**: bcrypt (cost 10)
✅ **Random Salt**: Per password hash
✅ **Never Exposed**: Password excluded from API responses
✅ **Timing Resistant**: bcrypt's slow hash prevents timing attacks

## Infrastructure

- Framework: Bun test runner
- Database: MongoDB Memory Server (isolated, no external DB)
- Dependencies: bcrypt@6.0.0, mongodb-memory-server@9.5.0

All tests pass. ✨
