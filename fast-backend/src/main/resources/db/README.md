# Database init

- **Local (H2):** Use **init-h2.sql** — tables + seed users/applications. Spring runs it when `spring.profiles.active=local` (default). Sign in via /login (e.g. "Sign in as" user; no password). Optional seed tickets: **seed-h2.sql**.
- **Dev / Prod (Oracle):** Use **init-oracle.sql** — tables only. Run once per schema as schema owner. Set `spring.profiles.active=dev` or `prod` and ORACLE_* env vars. All data via admin or UI.

No migrations. One script per database.
