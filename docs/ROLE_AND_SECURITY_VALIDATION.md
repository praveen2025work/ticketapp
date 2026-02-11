# Role and Security Validation

This document confirms that the FAST application enforces roles correctly at the API layer. Use it to validate that the system works as intended for each role.

## Backend (Spring Security)

Security is configured in `SecurityConfig.java`. Rules are evaluated in order; the first match wins.

### Public (no auth)

| Path | Method | Purpose |
|------|--------|---------|
| `/swagger-ui/**`, `/v3/api-docs/**`, `/swagger-ui.html` | GET | API docs |
| `/h2-console/**` | * | H2 console (dev) |
| `/actuator/**` | * | Health/metrics |
| `/api/v1/bam/**` | * | BAM token + AD user (bootstrap) |
| `/api/v1/auth/login` | POST | Local login |

### Authenticated only (any role including READ_ONLY)

| Path | Method | Purpose |
|------|--------|---------|
| `/api/v1/**` | GET | All read operations (dashboard, problems, tickets, knowledge, approvals/history, users/me, etc.) |

So: **READ_ONLY** can call any GET and nothing else.

### Role-specific

| Path | Method | Allowed roles |
|------|--------|----------------|
| `/api/v1/problems` | POST | RTB_TEAM, SERVICE_DESK, ADMIN |
| `/api/v1/problems/**` | PUT | TECHNICIAN, PROBLEM_MANAGER, ADMIN |
| `/api/v1/problems/**` | DELETE | ADMIN |
| `/api/v1/problems/*/status` | PATCH | TECHNICIAN, PROBLEM_MANAGER, ADMIN |
| `/api/v1/knowledge/**` | PUT | TECHNICIAN, PROBLEM_MANAGER, ADMIN |
| `/api/v1/approvals/problems/*/submit` | POST | RTB_TEAM, SERVICE_DESK, ADMIN |
| `/api/v1/approvals/*/approve`, `.../reject` | PUT | REVIEWER, ADMIN |
| `/api/v1/approvals/pending` | GET | REVIEWER, ADMIN |
| `/api/v1/auth/register` | POST | ADMIN |
| `/api/v1/audit/recent` | GET | ADMIN |

Anything not listed above falls under `anyRequest().authenticated()` (any logged-in user).

## Validation matrix (expected behavior)

| Role | Create ticket | Edit ticket | Update status | Delete ticket | Submit for approval | Approve/Reject | View approvals | Update KB article | Register user | Audit log |
|------|----------------|-------------|----------------|---------------|----------------------|----------------|----------------|-------------------|---------------|-----------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RTB_TEAM | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SERVICE_DESK | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| REVIEWER | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| PROBLEM_MANAGER | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅* | ✅ | ❌ | ❌ |
| TECHNICIAN | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅* | ✅ | ❌ | ❌ |
| READ_ONLY | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌** | ❌ | ❌ | ❌ |

\* GET approvals/pending is restricted to REVIEWER, ADMIN; GET approvals/problems/{id}/history is authenticated (any role).  
\** READ_ONLY can view tickets and dashboard but cannot open the “pending approvals” list (GET /approvals/pending returns 403).

## How to validate

1. **Use BAM/local auth** with a user that has one of the roles above (or use the dev user switcher on localhost with a user that has that role in the DB).
2. **Call the API** (browser, Postman, or frontend) for an action that should be allowed or denied.
3. **Expected:**
   - Allowed: 200/201 and normal response.
   - Denied: 403 Forbidden (and no state change).

Example checks:

- **READ_ONLY:** POST `/api/v1/problems` → 403. GET `/api/v1/problems` → 200.
- **RTB_TEAM:** POST `/api/v1/problems` → 201. PUT `/api/v1/problems/1` → 403.
- **REVIEWER:** PUT `/api/v1/approvals/1/approve` → 200. POST `/api/v1/problems` → 403.
- **ADMIN:** DELETE `/api/v1/problems/1` → 204. GET `/api/v1/audit/recent` → 200.

## Frontend

The UI hides or shows actions based on `user.role` (e.g. “Create Ticket” only for RTB_TEAM, SERVICE_DESK, ADMIN; “Approvals” and approve/reject for REVIEWER, ADMIN). The backend remains the authority: even if the frontend is bypassed, the API returns 403 for disallowed roles.
