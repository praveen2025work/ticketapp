# Database init

- **Local (H2):** Use **init-h2.sql** — tables + seed users/applications. Spring runs it when `spring.profiles.active=local` (default). Sign in via /login (e.g. "Sign in as" user; no password). Optional seed tickets: **seed-h2.sql**.
- **Prod-H2 (file-based H2):** Use profile `spring.profiles.active=prod-h2`. Data persists in a file. Configure via env vars: `H2_DATABASE_PATH` (default `./data/fastdb`), `H2_SCHEMA` (default `FAST`), `H2_USERNAME` (default `sa`), `H2_PASSWORD` (empty). Schema is created/updated by Hibernate (`ddl-auto: update`). For **first-time setup**:
  1. Start the app once so Hibernate creates tables.
  2. Run **seed-prod-h2-users.sql** to populate admin/users. If using custom `H2_SCHEMA`, run `SET SCHEMA your_schema;` first in H2 console. Replace placeholder `your_ldap_username` (and any other usernames) with the **LDAP usernames** that will sign in — these must match the value sent in `X-Authenticated-User`, `REMOTE_USER`, or `X-Remote-User` (domain prefix like `DOMAIN\user` is stripped; lookup is case-insensitive). Users not in the table get READ_ONLY access.
  3. Optionally run the data portion of **init-h2.sql** for applications and **seed-h2.sql** for sample tickets. Do not use `spring.sql.init.mode: always` for prod-h2. H2 console is off by default; set `H2_CONSOLE_ENABLED=true` to enable.
- **Dev / Prod (Oracle):** Use **init-oracle.sql** — tables only. Run once per schema as schema owner. Set `spring.profiles.active=dev` or `prod` and ORACLE_* env vars. All data via admin or UI.

No migrations. One script per database.
