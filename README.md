# FAST – Finance Accelerated Support Team

Enterprise Problem Ticket System for managing problems, approvals, and knowledge base articles.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Running the Application](#running-the-application)
- [Creating New Components](#creating-new-components)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 5, Tailwind CSS 4, React Router 7, TanStack Query, Axios |
| **Backend** | Spring Boot 3.2, Java 17, Spring Security, Spring Data JPA |
| **Database** | H2 (local), Oracle (dev/prod) |
| **Auth** | JWT, BAM SSO (optional), AD (Windows Auth for prod/dev/prod-h2) |
| **API Docs** | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`) |

---

## Project Structure

```
fast/
├── fast-backend/                    # Spring Boot API
│   ├── src/main/java/com/enterprise/fast/
│   │   ├── config/                  # Security, CORS, Web, JWT, BAM filters
│   │   ├── controller/              # REST controllers
│   │   ├── service/                 # Business logic
│   │   ├── repository/              # JPA repositories
│   │   ├── domain/                  # Entities, enums
│   │   ├── dto/                     # Request/response DTOs
│   │   ├── mapper/                  # Entity-DTO mappers
│   │   ├── exception/               # Global exception handler
│   │   └── scheduler/               # Background jobs
│   ├── src/main/resources/
│   │   ├── application.yml          # Base config
│   │   ├── application-local.yml    # H2, local profile
│   │   ├── application-prod-h2.yml  # File-based H2
│   │   └── db/                      # SQL init scripts
│   └── pom.xml
│
├── fast-frontend/                   # React SPA
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   └── charts/              # Chart components
│   │   ├── pages/                   # Route-level pages
│   │   ├── shared/
│   │   │   ├── api/                 # API clients (axios)
│   │   │   ├── context/             # React contexts (Auth, Theme, etc.)
│   │   │   ├── types/               # TypeScript types
│   │   │   └── utils/               # Helpers
│   │   ├── hooks/                   # Custom hooks
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── config.json              # Runtime config (apiBaseUrl, authMode, adApiUrl)
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                            # Additional documentation
├── pom.xml                          # Parent Maven POM
└── README.md
```

---

## Local Setup

### Prerequisites

- **Node.js** 20+ and npm (for frontend)
- **Java** 17 (for backend)
- **Maven** 3.8+ (for backend)

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd fast
```

### 2. Backend (Spring Boot)

```bash
cd fast-backend
mvn clean install
```

Default profile is `local`. Uses H2 in-memory DB; schema and seed data are loaded from `db/init-h2.sql` and `db/seed-h2.sql`.

### 3. Frontend (React)

```bash
cd fast-frontend
npm install
```

### 4. Runtime config (optional)

For local dev, `public/config.json` defaults work:

```json
{
  "apiBaseUrl": "http://localhost:8081/api/v1",
  "authMode": "local",
  "adApiUrl": ""
}
```

- `authMode: "local"` – uses X-Authenticated-User header (dev user switcher).
- `adApiUrl` – only used when `authMode` is `"ad"`.

---

## Running the Application

### Option A: Separate processes (recommended for dev)

**Terminal 1 – Backend**

```bash
cd fast-backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8081`.

**Terminal 2 – Frontend**

```bash
cd fast-frontend
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8081`.

### Option B: Unified JAR (production-style)

```bash
mvn -f fast-backend/pom.xml clean package -DskipTests
java -jar fast-backend/target/fast-backend-1.0.0-SNAPSHOT.jar
```

Serves UI and API on `http://localhost:8081`.

To skip frontend build:

```bash
mvn -f fast-backend/pom.xml package -P backend-only -DskipTests
```

### H2 Console (local only)

When using `local` profile: `http://localhost:8081/h2-console`  
JDBC URL: `jdbc:h2:mem:fastdb` | User: `sa` | Password: (empty)

---

## Creating New Components

### Frontend (React)

**1. Page component** – add under `src/pages/` and register in `App.tsx`:

```tsx
// src/pages/MyPage.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

In `App.tsx`:

```tsx
import MyPage from './pages/MyPage';
// ...
<Route path="mypage" element={<MyPage />} />
```

**2. Reusable component** – add under `src/components/`:

```tsx
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <div className="rounded-lg border p-4">{title}</div>;
}
```

**3. API client** – add under `src/shared/api/`:

```tsx
// src/shared/api/myApi.ts
import axiosClient from './axiosClient';

export const myApi = {
  getItems: () => axiosClient.get('/my/items'),
  createItem: (data: ItemRequest) => axiosClient.post('/my/items', data),
};
```

**4. Styling** – use Tailwind classes. Dark mode: `dark:bg-slate-800`, etc. Theme is managed by `ThemeContext`.

**5. Testing** – add `*.test.ts` or `*.test.tsx` next to the file. Run: `npm test`.

### Backend (Spring Boot)

**1. Controller** – add under `controller/`:

```java
@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class MyController {
    private final MyService myService;

    @GetMapping
    public ResponseEntity<List<MyResponse>> list() {
        return ResponseEntity.ok(myService.findAll());
    }
}
```

**2. Service** – add interface in `service/`, implementation in `service/impl/`.

**3. Entity & repository** – add entity in `domain/entity/`, repository in `repository/`.

**4. Security** – update `SecurityConfig.java` with new paths and roles.

**5. Tests** – add unit tests in `src/test/java/` mirroring the package structure.

---

## Troubleshooting

### Frontend

| Issue | Fix |
|-------|-----|
| `npm run dev` fails | Run `npm install` again. Ensure Node 20+. |
| API calls 404 | Check `config.json` and Vite proxy (`/api` → `http://localhost:8081`). |
| CORS errors | Backend CORS is in `WebConfig`. Add origin in `CORS_ORIGINS_IN_CODE` or `CORS_ALLOWED_ORIGINS` env. |
| Auth / 401 | Local: ensure `authMode: "local"` and backend uses `app.auth.mode: local`. Check `X-Authenticated-User` or dev user switcher. |

### Backend

| Issue | Fix |
|-------|-----|
| Port 8081 in use | Change `server.port` in `application.yml` or set `SERVER_PORT` env. |
| H2 schema errors | Clean DB: delete `./data/fastdb*` if using file H2. For `local`, restart app (in-memory DB resets). |
| Tests fail | Run `mvn clean test`. Check `application-local.yml` and `db/` scripts. |
| JWT errors | Set `APP_JWT_SECRET` in prod. Local uses default secret. |
| Oracle connection | Use `dev` or `prod` profile with Oracle URL in `application-dev.yml` / `application-prod.yml`. |

### Unified build

| Issue | Fix |
|-------|-----|
| Frontend not in JAR | Run full `mvn package` (not `-P backend-only`). Ensure `fast-frontend` exists and `npm run build` succeeds. |
| SPA routes 404 | `SpaPageResourceResolver` serves `index.html` for client routes. Verify `classpath:/static/` has `index.html`. |

---

## Testing

### Frontend

```bash
cd fast-frontend
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Backend

```bash
cd fast-backend
mvn test
```

---

## Configuration

### Backend (`application.yml` + profiles)

| Key | Description | Default |
|-----|-------------|---------|
| `app.auth.mode` | `local`, `ad`, or `bam` | `local` |
| `app.auth.local.default-user` | Default user for local | `admin` |
| `app.jwt.secret` | JWT signing key | (default in code; set `APP_JWT_SECRET` in prod) |
| `spring.profiles.active` | `local`, `dev`, `prod`, `prod-h2` | `local` |

### Frontend (`config.json`)

| Key | Description |
|-----|-------------|
| `apiBaseUrl` | Backend API base (e.g. `http://localhost:8081/api/v1`) |
| `authMode` | `local` or `ad` |
| `adApiUrl` | AD API URL when `authMode` is `ad` (e.g. `http://internal-host:5000/api/getADUsers`) |

### Environment variables

| Variable | Description |
|----------|-------------|
| `APP_JWT_SECRET` | JWT secret (production) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins |
| `SPRING_PROFILES_ACTIVE` | Active profile |
| `H2_DATABASE_PATH` | H2 file path for prod-h2 |
| `VITE_API_BASE_URL` | Build-time API URL (frontend) |
| `VITE_AUTH_MODE` | Build-time auth mode (frontend) |

---

## Deployment

### Unified JAR

```bash
mvn -f fast-backend/pom.xml clean package -DskipTests
# JAR: fast-backend/target/fast-backend-1.0.0-SNAPSHOT.jar
```

Run with:

```bash
java -jar fast-backend-1.0.0-SNAPSHOT.jar
# Or with profile:
java -jar fast-backend-1.0.0-SNAPSHOT.jar --spring.profiles.active=prod-h2
```

### config.json for production

Place `config.json` next to `index.html` (or in the same folder as the deployed app). For same-origin deployment:

```json
{
  "apiBaseUrl": "",
  "authMode": "ad",
  "adApiUrl": "http://your-ad-host:5000/api/getADUsers"
}
```

---

## Further Documentation

- `fast-frontend/README.md` – API URL and config
- `fast-backend/src/main/resources/db/README.md` – Database setup
- `docs/USER_GUIDE.md` – End-user guide
- `docs/ROLE_AND_SECURITY_VALIDATION.md` – Role and API security
- `BAM_SSO_GUIDE.md` – BAM SSO setup (legacy)
- `WINDOWS_SERVER_DEPLOYMENT.md` – Windows Server deployment
