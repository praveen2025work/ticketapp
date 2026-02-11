-- Add BRID field and make password optional for LDAP authentication
ALTER TABLE users ADD COLUMN brid VARCHAR(20) UNIQUE;
ALTER TABLE users ALTER COLUMN password VARCHAR(255) NULL;
