# FAST – Code and Deployment Standards

This document summarizes how this codebase aligns with industry practices for enterprise deployment. Use it for security review and onboarding.

## No Third-Party Product References

- The application code and documentation contain **no references** to Cursor, Claude, or other AI/IDE products.
- The word “cursor” appears only in CSS class names (e.g. `cursor-pointer`, `cursor-not-allowed`) for UI styling.

## Security

- **Secrets**: No production secrets in source. JWT signing key is read from `APP_JWT_SECRET` (required in prod). See `.env.example`.
- **Passwords**: SMTP and DB passwords come from environment or app settings (masked in API). `PasswordHashGenerator` is a one-time seed-data utility only.
- **Auth**: Stateless JWT; optional BAM/Windows SSO. Role-based access enforced in `SecurityConfig` and `@PreAuthorize` where used.
- **CORS**: Configurable via `CORS_ALLOWED_ORIGINS`; credentials allowed only for configured origins.
- **H2 console**: Enabled only for `local` profile; disabled in `dev` and `prod`.

## Backend (Spring Boot)

- **Structure**: Layered (controller → service → repository), DTOs for API, global exception handler returning consistent JSON.
- **Validation**: Bean Validation on request DTOs; `GlobalExceptionHandler` maps `MethodArgumentNotValidException` to 400 with field errors.
- **Logging**: SLF4J; no production secrets logged. SQL logging only in local profile.
- **Config**: Profile-based (`local` / `dev` / `prod`); DB and JWT from environment in non-local profiles.

## Frontend (React + TypeScript)

- **Structure**: Feature-oriented (pages, components, shared api/context/types). Typed API layer and shared types.
- **State**: React Query for server state; React context for auth/theme/refresh. Hooks follow rules (no conditional hooks).
- **Errors**: Centralized axios interceptor for 401/403; ErrorBoundary for UI failures. No unguarded `console` in production paths beyond error reporting.
- **Config**: API base URL from `config.json` (runtime) or `VITE_API_BASE_URL` (build time); no secrets in repo.

## Deployment Checklist

1. Set `APP_JWT_SECRET` (and Oracle vars if using dev/prod) per `.env.example`.
2. Use `spring.profiles.active=prod` for production backend.
3. Configure `CORS_ALLOWED_ORIGINS` for your frontend origin(s).
4. Do not commit `.env` or any file containing real secrets.
