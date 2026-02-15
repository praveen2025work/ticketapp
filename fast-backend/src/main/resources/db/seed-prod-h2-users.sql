-- =============================================================================
-- Prod-H2: Seed admin / user data for LDAP authentication
-- =============================================================================
-- Run this once after the app has created the schema (Hibernate ddl-auto: update).
-- If using custom H2_SCHEMA (default: FAST), run first: SET SCHEMA your_schema;
--
-- Username must match the value sent by LDAP:
--   - Taken from X-Authenticated-User, REMOTE_USER, or X-Remote-User (in that order).
--   - Domain prefix is stripped (e.g. DOMAIN\jdoe -> jdoe). Lookup is case-insensitive.
-- If a user is not found in the users table, they get READ_ONLY access.
--
-- Replace the placeholder usernames below with your real LDAP usernames (e.g. sAMAccountName).
-- =============================================================================

-- Ensure users table exists (Hibernate creates it with prod-h2; this is a safeguard for manual runs)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    brid VARCHAR(20) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    region VARCHAR(10),
    active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP
);

-- Seed: one ADMIN user. Replace 'your_ldap_username' with the LDAP username that will sign in.
-- MERGE is re-runnable: updates if username exists, inserts otherwise.
MERGE INTO users (username, brid, email, full_name, role, region, active)
KEY (username)
VALUES (
    'your_ldap_username',  -- Must match LDAP (X-Authenticated-User / REMOTE_USER after domain strip)
    'BR001',
    'admin@yourcompany.com',
    'FAST Admin',
    'ADMIN',
    'AMER',
    true
);

-- Example: additional users (uncomment and replace usernames with real LDAP values)
-- MERGE INTO users (username, brid, email, full_name, role, region, active) KEY (username) VALUES ('reviewer_ldap_username', 'BR002', 'reviewer@yourcompany.com', 'Finance Reviewer', 'REVIEWER', 'AMER', true);
-- MERGE INTO users (username, brid, email, full_name, role, region, active) KEY (username) VALUES ('approver_ldap_username', 'BR003', 'approver@yourcompany.com', 'IT Approver', 'APPROVER', 'AMER', true);
-- MERGE INTO users (username, brid, email, full_name, role, region, active) KEY (username) VALUES ('techlead_ldap_username', 'BR004', 'techlead@yourcompany.com', 'BTB Tech Lead', 'TECH_LEAD', 'AMER', true);
