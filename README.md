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

### Key Endpoints (Auth & Profile) – Versioned (`/api/v1`)
- `POST /api/v1/auth/otp/request { phone }`
- `POST /api/v1/auth/otp/verify { phone, otp }` -> returns JWT
- `GET /api/v1/auth/me` (auth)
- `PATCH /api/v1/auth/me` (auth) update profile
 - `GET /api/v1/auth/google` (redirects to Google OAuth consent)
 - `GET /api/v1/auth/google/callback` (OAuth completion -> issues JWT & redirects to `/login?token=...`)

### Standard Success Envelope (Backend → Frontend Contract)
All successful JSON responses share a normalized envelope to simplify client handling and enable correlation tracing:
```
{
  "success": true,
  "message": "<semantic_code>",
  "requestId": "<uuid>",
  "timestamp": "2025-09-24T18:55:24.470Z",
  "data": {
    // example: otp_verified
    "token": "<jwt>",
    "user": { "id": "...", "name": "...", ... }
  }
}
```
Notes:
- `requestId` is generated per request and propagated; log lines include the same value.
- `message` is a stable, machine-friendly string (e.g. `otp_verified`, `profile_updated`, `me`).
- Domain fields (e.g. `user`, `token`, `prediction`, etc.) ALWAYS live inside `data` (never at the root).
- Some earlier commits returned root-level `user`; a contract test now enforces the standardized nested shape.

Error responses use:
```
{
  "success": false,
  "error": "VALIDATION_ERROR|RATE_LIMIT|...",
  "message": "Human readable summary",
  "status": 400,
  "requestId": "<uuid>",
  "timestamp": "...",
  "details": [
    { "field": "email", "code": "EMAIL_FORMAT", "message": "Email is invalid" }
  ]
}
```

### Contract Tests
`backend/tests/envelope.shape.test.js` guards this envelope format (token & user must appear under `data.*`). If you change the envelope intentionally, update the test and this documentation together.

### Predictions & Numerology
- `POST /api/v1/predictions/numerology/name-number { name }` (auth)
- `POST /api/v1/predictions/numerology/destiny-match { nameA, nameB }` (auth)
- `GET /api/v1/predictions?page=1&limit=10` (auth) paginated predictions

### Reports
- `GET /api/v1/reports/prediction/:id/pdf` (auth)
- `GET /api/v1/reports/predictions.csv` (auth)
- `POST /api/v1/payments/initiate { amount, productInfo }` (auth)
 - `POST /api/v1/payments/payu/callback` (PayU callback target)

> API Versioning: All new endpoints should be added under `/api/v1`. The unversioned `/api` prefix has been deprecated in favor of explicit versioning for forward compatibility. If backward compatibility is required in the future, a thin legacy router can be reintroduced to proxy `/api/*` → `/api/v1/*`.

## Frontend
1. Copy `frontend/ENV_EXAMPLE` to `frontend/.env`.
2. Install & run:
```
cd frontend
npm install
npm run dev
```

### Frontend Structure
Key directories/components:

- `src/components/ui/HeaderBar.jsx` – Global navigation shell (fixed header) used across all pages. Renders theme toggle, auth actions, dropdown nav groups, and the possessive profile label (e.g. `Adam's Profile`). This supersedes an earlier simpler `Header.jsx` which has been removed to avoid duplication.
- `src/utils/formatProfileLabel.js` – Utility that generates the possessive profile label; covered by a unit test to ensure formatting is stable.
- `src/context/AuthContext.jsx` – Persists `token` and `user` (bootstraps user from localStorage + `/auth/me` on reload).
- `src/components/ProtectedRoute.jsx` – Guards private routes; redirects unauthenticated users to `/login` with a toast.
- `src/services/*` – Thin API clients (axios instance auto-attaches JWT & request ID).

### Theming & Accessibility
The UI supports:
- Day (light) and Night (dark) themes (class-based dark mode: `<html class="dark">`).
- Optional High Contrast mode: adds `high-contrast` class to `<html>` layered on top of current theme. This strengthens borders, link contrast, and reduces translucency for users needing additional clarity.

State Management:
- `ThemeContext` persists preferences in `localStorage` keys `pref:theme` and `pref:highContrast`.
- `ThemeToggle` now renders two adjacent icon buttons: theme switch (sun/moon) and a contrast switch (contrast icon). The contrast control has `aria-pressed` for assistive tech.

Utilities / CSS Tokens:
- Light mode introduces CSS variables (e.g. `--color-bg-alt`, `--color-border-subtle`, brand tint blends using `color-mix`).
- High contrast mode simply adds root overrides; no user data mutation required.
- Additional helper classes: `.surface-tint{,-soft,-accent}`, `.fieldset`, `.section-divider`, `.emphasis-surface`, `.bg-alt`.

#### Automated A11y Audit
Run a lightweight accessibility & contrast audit (axe-core via Playwright) over core routes:
```
cd frontend
npm install   # ensure dev deps present (playwright needs first install)
npm run audit:a11y
```
Outputs JSON report(s) to `frontend/a11y-reports/` with filtered violations (default: impact >= serious). Environment vars:
```
A11Y_BASE=http://localhost:5173   # override base
A11Y_SEVERITY=moderate            # change severity threshold
HEADLESS=false                    # view browser during audit
```
CI suggestion: set `A11Y_SEVERITY=serious` so build fails only on serious/critical issues.

Adding New Theme-Specific Styles:
Prefer selectors scoped with `html:not(.dark)` for light and `.dark` for night. For high contrast combinations, prefix with `html.high-contrast:not(.dark)` (light high contrast) or `html.high-contrast.dark` (future dark high contrast if needed).

Accessibility Notes:
- Focus rings standardized (`focus-visible` ring offset & brand color) across variants.
- Form labels and muted text in light theme were darkened to exceed WCAG 2.1 AA contrast (labels ~6.2:1 against background, body text > 7:1).
- Ghost buttons in light mode now have visible borders & higher contrast hover states.

If you add new navigation sections, extend `navGroups` in `src/components/navigationData.js`; `HeaderBar` will render them automatically.

## Running the Application (Local Dev Without Docker)
This setup runs each service directly on your host machine (ideal for fast iteration with hot reload).

### 1. Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ (comes with Node)
- Local MongoDB (optional if you use a remote cluster) – default port 27017
- (Optional) Local Redis for caching (recommended). If absent, numerology caching will fail to init gracefully; you can point `REDIS_URL` to a running instance.

### 2. Backend Environment File
Create `backend/.env` (copy from `backend/ENV_EXAMPLE` if present or compose the following):
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/rapid_astrology
JWT_SECRET=dev_change_me
OTP_EXPIRY_MINUTES=5
PAYU_MERCHANT_KEY=your_payu_key
PAYU_MERCHANT_SALT=your_payu_salt
PAYU_BASE_URL=https://test.payu.in
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
REPORT_ENCRYPTION_KEY=dev_report_key_32chars
BACKEND_PUBLIC_URL=http://localhost:4000
CACHE_TTL_SECONDS=3600
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

If you don't have Redis locally you can comment out `REDIS_URL` (the app will log connection failure; numerology caching will be disabled). For production parity it’s better to run Redis.

### 3. Frontend Environment File
Create `frontend/.env` (optional for default behavior):
```
VITE_GOOGLE_OAUTH_ENABLED=true
VITE_BACKEND_BASE=http://localhost:4000
```
Currently `api.js` uses a relative baseURL (`/api`). During dev Vite proxy can be added if needed; with the backend on port 4000 and frontend on 5173, your browser will hit `http://localhost:5173/api/*` and unless you configure a proxy you should change `api.js` to use `VITE_BACKEND_BASE` OR run a proxy. Simplest: adjust the axios instance:
```js
// (Optional improvement) baseURL: import.meta.env.VITE_BACKEND_BASE + '/api'
```
Otherwise add a proxy in `vite.config.js`:
```js
// server: { proxy: { '/api': 'http://localhost:4000' } }
```

### 4. Install & Run Backend
```
cd backend
npm install
npm run dev
```
The server starts on `http://localhost:4000` with Nodemon auto‑reload.

### 5. Install & Run Frontend
In a new terminal:
```
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

### 6. Google OAuth Notes
- Ensure `GOOGLE_CALLBACK_URL` matches the authorized redirect URI in your Google Cloud Console.
- The backend redirects to `/login?token=...` or `/oauth/callback` depending on configuration.

### 7. PayU Sandbox
Use provided sandbox credentials; hash validation flow hinges on `PAYU_MERCHANT_SALT`.

### 8. Testing Backend
```
cd backend
npm test
```
Uses in-memory Mongo (no external DB required for tests) & skips Redis init.

### 9. Common Local Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| CORS errors | FRONTEND_URL mismatch | Match `FRONTEND_URL` exactly (including protocol & port). |
| Mongo connect retry logs | Wrong `MONGO_URI` or Mongo not running | Start Mongo or correct URI. |
| Redis init failed | Redis not running | Start Redis or remove `REDIS_URL` temporarily. |
| OAuth redirect mismatch | Callback URL differs | Align Google console value & `.env`. |

## Running the Application in Production (Docker)
Use Docker Compose for a containerized stack including Mongo, Redis, backend, and an Nginx-served frontend build.

### 1. Prepare Environment Overrides (Optional)
You can edit `docker-compose.yml` environment block under `backend:` for secrets (recommend using an `.env` + variable interpolation in compose for real deployments). Minimum to review: `JWT_SECRET`, PayU keys, Google credentials, `BACKEND_PUBLIC_URL`.

### 2. Build & Start
```
docker compose up --build -d
```
Services:
- Frontend: http://localhost:5173 (served from built assets)
- Backend:  http://localhost:4000
- MongoDB:  localhost:27017
- Redis:    localhost:6379

### 3. Logs & Management
```
docker compose logs -f backend
docker compose logs -f frontend
docker compose ps
docker compose down        # Stop & remove containers
docker compose down -v     # Also remove volumes (including Mongo data!)
```

### 4. Rebuilding After Code Changes
For backend tweaks:
```
docker compose build backend && docker compose up -d backend
```
For frontend UI changes:
```
docker compose build frontend && docker compose up -d frontend
```
Or rebuild everything: `docker compose up --build -d`.

### 5. Adding HTTPS / Reverse Proxy
For production you’d normally place Traefik, Caddy, or Nginx with TLS termination in front. Adjust CORS `FRONTEND_URL` & `BACKEND_PUBLIC_URL` to your domain.

### 6. Data Persistence
`mongo_data` named volume keeps Mongo between restarts. Use `docker compose down -v` cautiously.

### 7. Environment Variable Summary (Backend)
| Variable | Purpose | Dev Default |
|----------|---------|-------------|
| PORT | Backend port | 4000 |
| MONGO_URI | Mongo connection | mongodb://mongo:27017/... (docker) / localhost (dev) |
| JWT_SECRET | Sign JWTs | change_me |
| OTP_EXPIRY_MINUTES | OTP validity minutes | 5 |
| PAYU_MERCHANT_KEY/SALT/BASE_URL | PayU sandbox credentials | test values |
| FRONTEND_URL | Allowed CORS origins (comma separated) | http://localhost:5173 |
| REDIS_URL | Redis connection string | redis://redis:6379 (docker) |
| REPORT_ENCRYPTION_KEY | Placeholder secret for report encryption | dev_report_key_32chars |
| CACHE_TTL_SECONDS | Numerology caching TTL | 3600 |
| BACKEND_PUBLIC_URL | External base URL (callbacks) | http://localhost:4000 |
| GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL | OAuth credentials | none |

### 8. Health Check
`GET /health` returns JSON `{ status, time }`. Useful for container readiness probes.

### 9. Zero-Downtime Strategy (Future)
- Build images & push to registry.
- Deploy via rolling updates on your orchestrator (Kubernetes/Swarm) with readiness using `/health`.

---


## UI Modernization (Tailwind CSS)

The frontend has been upgraded with Tailwind CSS for a modern, utility‑first styling approach including a subtle spotlight background, glassmorphism surfaces, and dark mode.

### Added Dependencies
Dev dependencies in `frontend/`:
- tailwindcss
- postcss / autoprefixer
- @tailwindcss/forms @tailwindcss/typography @tailwindcss/container-queries

### Key Files
| File | Purpose |
|------|---------|
| `frontend/tailwind.config.js` | Tailwind configuration, dark mode via `class`, custom brand palette, animations. |
| `frontend/postcss.config.js` | PostCSS pipeline enabling Tailwind + Autoprefixer. |
| `frontend/src/index.css` | Tailwind directives + custom utilities (glass panels, spotlight overlay, buttons). |
| `frontend/src/context/ThemeContext.jsx` | Toggles `dark` class on `<html>` for dark mode. |
| `frontend/src/components/*` | Refactored with Tailwind utilities for layout and interaction. |

### Running with Tailwind
Just use existing scripts:
```
cd frontend
npm run dev
```
Vite processes Tailwind through PostCSS automatically.

### Dark Mode
Theme toggle switches between `day` and `night` which adds/removes the `dark` class on `<html>`. Tailwind's `dark:` variants now apply.

### Utility Classes Introduced
- `glass` – translucent blurred surface.
- `btn-primary`, `btn-ghost` – button variants.
- `h1-gradient` – gradient heading text.
- Animations: `animate-fade-in`, `animate-scale-in` via config.

### Spotlight Effect
`spotlight-overlay` wrapper (applied at `App` root) draws a subtle radial highlight using CSS custom properties `--spot-x` & `--spot-y` (can be wired to mousemove later for interactive glow).

### Extending the Theme
Edit `tailwind.config.js` to add colors or animations. Trigger IntelliSense by referencing classes in JSX; purge (content scanning) is already configured for `./src/**/*.{js,jsx,ts,tsx}` and `index.html`.

### Adding Components
Prefer composing primitives using Tailwind utilities. For repeated patterns (cards, badges, alerts) add small component wrappers or utility classes in `index.css`.

### Future Enhancements
- Extract a `<SpotlightProvider>` to animate spotlight with cursor position.
- Create a `<Container>` layout component for consistent max-width handling.
- Add motion-safe / motion-reduce variants to animations for accessibility.
- Introduce a design tokens file (CSS variables) for brand gradients.

### Design Philosophy
Emphasis on:
1. Clear visual hierarchy (gradient headings, subdued body text).
2. Low-contrast dark background with luminous brand accents.
3. Accessible focus states (`focus-visible` rings using brand color).
4. Minimal custom CSS—utilities over bespoke styles for speed and consistency.

### Mobile Navigation
Implemented a portal-based `<MobileMenu />`:
- Opens via hamburger button on screens `< md`.
- Focus trap & ESC to close; background scroll locked while open.
- Shares navigation data (`navigationData.js`) with desktop discipline menu to avoid duplication.
- Auth actions (Login / Logout) included at bottom section.

To modify navigation groups edit: `frontend/src/components/navigationData.js`.

### Interactive Spotlight & Layout
- A `SpotlightTracker` component updates CSS custom properties `--spot-x` / `--spot-y` on pointer move (rAF throttled) producing a subtle moving radial highlight.
- `Container` component standardizes horizontal padding & max-width usage across pages and header.

### Icons
Replaced emoji UI icons with `lucide-react` (open-source SVG icon set). Example usage:
```
import { Sun, Moon } from 'lucide-react';
```
Theme toggle now cross-fades Sun/Moon with scaling/rotation transitions.

### Accessibility Enhancements
- Added a skip link (visible on focus) for keyboard users: jumps directly to main content.
- Ensured `role="main"` on the primary `<main>` element.
- Focus outlines use brand color with sufficient contrast.

### Tailwind Version Note
The project reverted to stable Tailwind CSS v3.x for predictable utility availability after experimenting with the `@tailwindcss/postcss` (v4 preview) plugin which produced unknown utility warnings (e.g. gradient `from-*` classes). The current stack uses:
```
"tailwindcss": "^3.4.x",
"postcss": "^8.4.x",
"autoprefixer": "^10.4.x"
```
If upgrading to Tailwind v4 later, remove the v3 config nuance and follow the official migration guide (re‑enable color utilities or adapt gradient syntax accordingly).
- Mobile menu implements focus trapping, ESC close, inert background scroll lock, and slide transition for motion clarity.
- Improved button contrast (`btn-ghost`).

### Future A11y Ideas
- Add `prefers-reduced-motion` handling to disable spotlight animation & transitions for users requesting reduced motion.
- Add ARIA live region for async operations (e.g. loading predictions or payments).
- Implement color contrast automated test (axe / jest-axe) in CI.

### Design System Additions (Box, Card, HeaderBar, Input)
To standardize layout and visual rhythm a lightweight design system layer was introduced:

| Component | Location | Purpose |
|-----------|----------|---------|
| `Box` | `src/components/ui/Box.jsx` | Page-level wrapper providing vertical spacing beneath fixed header & centered max width. |
| `Card` | `src/components/ui/Card.jsx` | Glass / elevated surface with unified padding, border, subtle shadow and optional `title` + `actions`. |
| `Input` / `Textarea` | `src/components/ui/Input.jsx` | Consistent form field styling (rounded-lg, focus ring, dark mode). |
| `HeaderBar` | `src/components/ui/HeaderBar.jsx` | Fixed top navigation (replaces earlier `Header`), shares navigation data via `navigationData.js`. |

All existing pages (Login, Numerology calculators, Profile, Payments, OAuth callback, Home) now compose these primitives without renaming or removing any original form fields or buttons, ensuring functional parity with prior implementation.

Example usage in a page:
```jsx
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

export default function ExamplePage(){
  return (
    <Box>
      <div className="max-w-md mx-auto">
        <Card title="Example" actions={<button className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Save</button>}>
          <Input placeholder="Type..." />
        </Card>
      </div>
    </Box>
  );
}
```

Benefits:
1. Consistent spacing & readable hierarchy.
2. Reduced inline style duplication (all legacy inline styles removed or migrated).
3. Dark mode coherence across surfaces & inputs.
4. Easier future extension (add variants in a single place).

If you introduce new calculator pages, wrap them in `Box` -> inner width container -> `Card` for immediate visual consistency.



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
| OTP_MIN_RESEND_INTERVAL_SECONDS | Minimum seconds before a new OTP can be requested for same user |
| OTP_RETRY_WINDOW_SECONDS | Rolling window for counting OTP verification attempts |
| OTP_MAX_ATTEMPTS | Max allowed failed attempts within retry window before lock/reset |
| GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL | Google OAuth credentials |
| PAYU_MERCHANT_KEY/SALT/BASE_URL | PayU gateway credentials (sandbox by default) |
| FRONTEND_URL | Allowed CORS origin |
| REPORT_ENCRYPTION_KEY | Placeholder for encrypting reports |
| REDIS_URL | Redis connection string for caching |
| CACHE_TTL_SECONDS | Redis cache TTL for numerology (default 3600) |
| BACKEND_PUBLIC_URL | Publicly accessible base URL of backend (used for PayU callbacks) |
| (Frontend) VITE_GOOGLE_OAUTH_ENABLED | Toggle displaying Google login button (default true) |

### OTP Flow (Config‑Driven)
OTP behavior is controlled centrally in `src/config/otp.config.js` pulling from the above env vars. Features:
1. Length & type (numeric/alphabetic/alphanumeric) – can be extended.
2. Expiry (minutes) via `OTP_EXPIRY_MINUTES`.
3. Resend throttling via `OTP_MIN_RESEND_INTERVAL_SECONDS` (returns 429 with `retryAfterSeconds`).
4. Attempt window via `OTP_RETRY_WINDOW_SECONDS` combined with `OTP_MAX_ATTEMPTS` to lock/reset OTP if exceeded.
5. Attempts & last issue timestamp stored on `User` document (`otpAttemptCount`, `lastOtpIssuedAt`).

### Metrics
A Prometheus scrape endpoint is exposed at `GET /metrics` (no auth by default – protect via reverse proxy or network policy in production).

Exported metrics:
| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `process_*` & default node metrics | various | n/a | From `prom-client.collectDefaultMetrics()` |
| `otp_requests_total` | counter | `result` = `ok` \| `too_soon` | OTP generation attempts |
| `otp_verifications_total` | counter | `result` = `valid` \| `invalid` \| `locked` | OTP verification outcomes |
| `otp_active_users` | gauge | none | Users currently holding an active (unconsumed & unexpired) OTP |

Integrate with Prometheus:
```
scrape_configs:
  - job_name: rapid_astrology_backend
    static_configs:
      - targets: ['backend-host:4000']
    metrics_path: /metrics
```

Alerting examples (pseudo):
```
ALERT OTPHighInvalidRate
  IF sum(increase(otp_verifications_total{result="invalid"}[5m]))
     / sum(increase(otp_verifications_total[5m])) > 0.8
  FOR 10m
  LABELS { severity = "warning" }
  ANNOTATIONS { summary = "High OTP invalid rate" }
```

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

