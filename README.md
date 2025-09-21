# Rapid Astrology

Full-stack example project combining Numerology & Astrology placeholder modules with OTP auth and PayU payment scaffold.

## Stack
Backend: Node.js, Express, MongoDB (Mongoose)  
Frontend: React (Vite)  
Auth: OTP (phone), Google OAuth (Passport)  
Payments: PayU (hash + initiation + callback scaffold)  
Cache: Redis (numerology results caching)  
Reports: PDF (pdfkit) & CSV streaming

## Monorepo Structure
```
rapid-astrology/
  backend/
  frontend/
  docker-compose.yml
```

## Backend
Run locally:
1. Copy `backend/ENV_EXAMPLE` to `backend/.env` and fill secrets.
2. Install deps & start:
```
cd backend
npm install
npm run dev
```

### Key Endpoints (Auth & Profile)
- `POST /api/auth/otp/request { phone }`
- `POST /api/auth/otp/verify { phone, otp }` -> returns JWT
- `GET /api/auth/me` (auth)
- `PATCH /api/auth/me` (auth) update profile
 - `GET /api/auth/google` (redirects to Google OAuth consent)
 - `GET /api/auth/google/callback` (OAuth completion -> issues JWT & redirects to `/login?token=...`)

### Predictions & Numerology
- `POST /api/predictions/numerology/name-number { name }` (auth)
- `POST /api/predictions/numerology/destiny-match { nameA, nameB }` (auth)
- `GET /api/predictions?page=1&limit=10` (auth) paginated predictions

### Reports
- `GET /api/reports/prediction/:id/pdf` (auth)
- `GET /api/reports/predictions.csv` (auth)
- `POST /api/payments/initiate { amount, productInfo }` (auth)
 - `POST /api/payments/payu/callback` (PayU callback target)

## Frontend
1. Copy `frontend/ENV_EXAMPLE` to `frontend/.env`.
2. Install & run:
```
cd frontend
npm install
npm run dev
```

### Login Methods
The login page now offers:
1. Google OAuth ("Continue with Google" button) – toggled via `VITE_GOOGLE_OAUTH_ENABLED` (default shown). Backend completes OAuth and redirects back to `/login?token=...` where the token is captured and the profile fetched automatically.
2. OTP (Phone) flow – request OTP then verify.

If you prefer using a dedicated callback route, you can change the backend redirect target to `/oauth/callback?token=...` (there is already a page for that), and remove the token handling logic inside `LoginPage.jsx`.

## Docker
```
docker compose up --build
```
Frontend: http://localhost:5173 (nginx serving build)  
Backend: http://localhost:4000  
Mongo: localhost:27017

### Local Dev (No Docker) Note
If you run the backend directly without `docker-compose`, change `MONGO_URI` from `mongodb://mongo:27017/...` to `mongodb://localhost:27017/...` and `REDIS_URL` from `redis://redis:6379` to `redis://localhost:6379`. The code now attempts an automatic fallback, but setting them explicitly avoids retry delays.

## Environment Variables (Backend)
| Name | Purpose |
|------|---------|
| PORT | Server port |
| MONGO_URI | Mongo connection string |
| JWT_SECRET | JWT signing secret |
| OTP_EXPIRY_MINUTES | OTP validity in minutes |
| GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL | Google OAuth credentials |
| PAYU_MERCHANT_KEY/SALT/BASE_URL | PayU gateway credentials (sandbox by default) |
| FRONTEND_URL | Allowed CORS origin |
| REPORT_ENCRYPTION_KEY | Placeholder for encrypting reports |
| REDIS_URL | Redis connection string for caching |
| CACHE_TTL_SECONDS | Redis cache TTL for numerology (default 3600) |
| BACKEND_PUBLIC_URL | Publicly accessible base URL of backend (used for PayU callbacks) |
| (Frontend) VITE_GOOGLE_OAUTH_ENABLED | Toggle displaying Google login button (default true) |

## Security Notes
- Helmet with custom CSP (script-src narrowed), rate limiting (global + per-OTP), HPP, CORS.
- Input validation via Zod for numerology input (extensible pattern).
- OTP hashed & expires; per-route rate limit to mitigate brute force.
- Redis caching layer reduces repeated numerology calculations.
- Further hardening recommended: audit logging, account lockouts, production PayU hash validation with response codes.

## Numerology Features & Caching
1. Name Number: Sums A=1..Z=26, reduces to single digit (keeps master numbers 11, 22) with interpretation.
2. Destiny Match: Computes compatibility score & description for two names; results cached in Redis (5 min default) for repeat queries.

Caching Keys Pattern: `nn:*` (hashed names) and `dm:*` (hashed sorted pair). Global invalidation runs on profile update (demo strategy). TTL configurable with `CACHE_TTL_SECONDS`.

## PayU Integration & Frontend Flow
Implements:
 - Transaction initiation with hash (SHA512 pattern) & persistent `txnid`.
 - Callback endpoint `/api/payments/payu/callback` verifies hash fields & updates Payment record.
 - Gateway callback redirects to `/payment/success?txnid=...` or `/payment/failure?txnid=...`.
 - Frontend pages consume `GET /api/payments/tx/:txnid` to surface status JSON.
 - Callback URLs built from `BACKEND_PUBLIC_URL` ensuring correct externally reachable path.

OAuth callback handled client-side by `/oauth/callback` page which parses `?token=` and fetches profile before routing to `/profile`.

Current configuration redirects OAuth back to `/login?token=...` where the login page also performs token capture (slight duplication with `/oauth/callback`; keep one path or consolidate as desired).

To Production-Harden:
 - Enforce HTTPS.
 - Validate status codes & amount integrity.
 - Add server-to-server verification if supported.

## Tooling
ESLint + Prettier configs included. Run:
```
npm run lint
npm run format
```
inside each package (backend / frontend) for consistency.

## Roadmap Ideas
- Frontend polish for OAuth redirect handling (display token usage feedback).
- Additional numerology & astrology calculators (life path, compatibility matrix, planetary positions).
- Payment success/failure frontend routes & optional webhook listener.
- File storage (S3) for generated PDFs & caching layer invalidation strategy.
- Role-based access & admin panel.
- Expanded unit & integration tests (current basic tests to be added for predictions & numerology soon).
- i18n & timezone aware date formatting.

## License
MIT (example project template).

## Testing

The backend includes an integration-style Jest test suite (Supertest) covering:
 - Health endpoint (`/health`)
 - OTP auth flow (request -> verify -> profile update persistence)
 - Numerology prediction endpoints & pagination

### In-Memory Mongo
Tests run against an ephemeral in-memory Mongo instance via `mongodb-memory-server`.
 - The application auto-skips its normal Mongo connection logic when `NODE_ENV=test`.
 - Each test file connects to its own memory server and tears it down in `afterAll`.
 - No external Mongo container/service is required to run tests.

### OTP Exposure in Tests
For realism the OTP is still hashed/stored, but in `NODE_ENV=test` the raw OTP is returned in the JSON response of `POST /api/auth/otp/request` so the follow-up verification step can proceed without stubbing SMS.
Production behavior (no OTP in response) is unchanged.

### Quiet Test Output
Set `QUIET_TESTS=1` to suppress OTP console logging during test runs:
```
cd backend
QUIET_TESTS=1 npm test
```
Without this flag the generated OTP values will appear in console (helpful while authoring new tests).

### Running the Suite
From `backend/`:
```
npm install   # first time
npm test
```
Or watch mode:
```
NODE_ENV=test npm run test:watch
```
The `NODE_ENV=test` is set automatically by the `test`/`test:watch` scripts, enabling:
 - Automatic Mongo connect skip
 - OTP exposure
 - Redis initialization skip (no Redis needed).

### Adding New Tests
Place files under `backend/tests` matching `*.test.js`. You can import Mongoose models directly; just ensure you reuse the existing pattern of spinning up a `MongoMemoryServer` in `beforeAll` and closing it in `afterAll`.

### Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Tests hang after completion | Open DB or server handle | Ensure you didn't call `app.listen` in a test; keep the conditional listen (already in `app.js`). |
| ENOTFOUND mongo errors appear | Running without updated `app.js` skip logic | Pull latest changes; in test mode it should log only "Skipping automatic Mongo connect". |
| OTP property missing in test | Environment not `test` | Make sure you're using `npm test` script so `NODE_ENV=test` is set. |
| Redis connection attempts | Custom test command lacking `NODE_ENV=test` | Use `npm test` or set `NODE_ENV=test`. |

### Future Enhancements
Potential next steps: add negative auth tests (invalid OTP / expired), caching layer tests with Redis mocked, and PayU callback signature verification tests using deterministic hash fixtures.

