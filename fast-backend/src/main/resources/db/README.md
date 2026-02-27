# Database init

- **Local (H2):** Use **init-h2.sql** — tables + seed users/applications. Spring runs it when `spring.profiles.active=local` (default). Sign in via /login (e.g. "Sign in as" user; no password). Optional seed tickets: **seed-h2.sql**.
- **Prod-H2 (file-based H2):** Use profile `spring.profiles.active=prod-h2`. Data persists in a file. Configure via env vars: `H2_DATABASE_PATH` (default `./data/fastdb`), `H2_SCHEMA` (default `FAST`), `H2_USERNAME` (default `sa`), `H2_PASSWORD` (empty). Schema is created/updated by Hibernate (`ddl-auto: update`). For **first-time setup**:
  1. Start the app once so Hibernate creates tables.
  2. Run **seed-prod-h2-users.sql** to populate:
     - users
     - applications
     - impacted user groups
     - user-application assignments
     - 5 sample tickets with region/application/user-group links
  3. If using custom `H2_SCHEMA`, run `SET SCHEMA your_schema;` first in H2 console. H2 console is off by default; set `H2_CONSOLE_ENABLED=true` to enable.
  4. If you want to load your own SQL file once at startup, run with:
      `--spring.sql.init.mode=always --spring.sql.init.data-locations=file:/absolute/path/your-data.sql`
  5. Keep your SQL idempotent (`MERGE` or guarded `INSERT`) because `always` executes on each start.
  6. After first successful load, remove those overrides and run with the default `spring.sql.init.mode=never`.
  7. For existing schemas upgrading to DQ/User Group support, run **migration-add-dq-user-groups.sql**.
- **Dev / Prod (Oracle):** Use **init-oracle.sql** — tables only. Run once per schema as schema owner. Set `spring.profiles.active=dev` or `prod` and ORACLE_* env vars.
  - Optional demo data seed (users, applications, user groups, assignments, and sample tickets): run **seed-oracle-sample-data.sql**.
  - For existing schemas upgrading to DQ/User Group support, run the Oracle section from **migration-add-dq-user-groups.sql**.

No migrations. One script per database.
