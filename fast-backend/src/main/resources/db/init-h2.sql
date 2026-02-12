-- =============================================================================
-- FAST - H2 Database Init (tables + one local admin for login)
-- Local only. Spring runs this when spring.profiles.active=local (in-memory H2).
-- All other data: add via UI or by admin. Oracle dev/prod use init-oracle.sql (tables only).
-- =============================================================================

-- USERS (no password; auth via BAM/LDAP or X-Authenticated-User for local)
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
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- APPLICATIONS (track applications; tickets can impact one-to-many; users can be linked)
CREATE TABLE IF NOT EXISTS applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50),
    description VARCHAR(500),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_applications_name ON applications(name);

-- USER_APPLICATION (many-to-many: users linked to applications they handle)
CREATE TABLE IF NOT EXISTS user_application (
    user_id BIGINT NOT NULL,
    application_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, application_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_application_app ON user_application(application_id);

-- FAST_PROBLEM (no regional_code; regions in fast_problem_region)
CREATE TABLE IF NOT EXISTS fast_problem (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    servicenow_incident_number VARCHAR(20),
    servicenow_problem_number VARCHAR(20),
    pbt_id VARCHAR(30),
    title VARCHAR(255) NOT NULL,
    description CLOB,
    user_impact_count INTEGER DEFAULT 0,
    affected_application VARCHAR(100),
    request_number VARCHAR(100),
    anticipated_benefits CLOB,
    classification VARCHAR(10) DEFAULT 'A',
    ticket_age_days INTEGER DEFAULT 0,
    status_indicator VARCHAR(10) DEFAULT 'R16',
    status VARCHAR(30) DEFAULT 'NEW',
    priority_score DOUBLE DEFAULT 0.0,
    priority INTEGER DEFAULT 3,
    target_resolution_hours INTEGER DEFAULT 4,
    api_integration_status VARCHAR(20) DEFAULT 'MANUAL_ENTRY',
    root_cause CLOB,
    workaround CLOB,
    permanent_fix CLOB,
    created_by VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(50),
    assignment_group VARCHAR(100),
    btb_tech_lead_username VARCHAR(50),
    confluence_link VARCHAR(500),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_status ON fast_problem(status);
CREATE INDEX IF NOT EXISTS idx_fast_problem_classification ON fast_problem(classification);
CREATE INDEX IF NOT EXISTS idx_fast_problem_pbt_id ON fast_problem(pbt_id);
CREATE INDEX IF NOT EXISTS idx_fast_problem_inc_number ON fast_problem(servicenow_incident_number);
CREATE INDEX IF NOT EXISTS idx_fast_problem_prb_number ON fast_problem(servicenow_problem_number);
CREATE INDEX IF NOT EXISTS idx_fast_problem_created_date ON fast_problem(created_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_deleted ON fast_problem(deleted);
CREATE INDEX IF NOT EXISTS idx_fast_problem_deleted_created ON fast_problem(deleted, created_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_affected_app ON fast_problem(affected_application);
CREATE INDEX IF NOT EXISTS idx_fast_problem_request_number ON fast_problem(request_number);

-- FAST_PROBLEM_APPLICATION (ticket can impact one-to-many applications)
CREATE TABLE IF NOT EXISTS fast_problem_application (
    fast_problem_id BIGINT NOT NULL,
    application_id BIGINT NOT NULL,
    PRIMARY KEY (fast_problem_id, application_id),
    CONSTRAINT fk_fpa_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_fpa_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_application_app ON fast_problem_application(application_id);

-- APPROVAL_RECORD (one record per role: REVIEWER, APPROVER, RTB_OWNER; anyone with that role can approve)
CREATE TABLE IF NOT EXISTS approval_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    approval_role VARCHAR(20) NOT NULL,
    reviewer_name VARCHAR(100),
    reviewer_email VARCHAR(100),
    decision VARCHAR(20) DEFAULT 'PENDING',
    comments CLOB,
    decision_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id)
);
CREATE INDEX IF NOT EXISTS idx_approval_problem_id ON approval_record(fast_problem_id);
CREATE INDEX IF NOT EXISTS idx_approval_decision ON approval_record(decision);
CREATE INDEX IF NOT EXISTS idx_approval_role ON approval_record(approval_role);

-- KNOWLEDGE_ARTICLE
CREATE TABLE IF NOT EXISTS knowledge_article (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT UNIQUE,
    title VARCHAR(255) NOT NULL,
    root_cause CLOB,
    workaround CLOB,
    permanent_fix CLOB,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_date TIMESTAMP,
    CONSTRAINT fk_knowledge_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge_article(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_date ON knowledge_article(created_date);

-- INCIDENT_LINK
CREATE TABLE IF NOT EXISTS incident_link (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    incident_number VARCHAR(20) NOT NULL,
    link_type VARCHAR(20) DEFAULT 'RELATED_TO',
    description VARCHAR(500),
    linked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incident_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id)
);
CREATE INDEX IF NOT EXISTS idx_incident_link_problem_id ON incident_link(fast_problem_id);
CREATE INDEX IF NOT EXISTS idx_incident_link_number ON incident_link(incident_number);

-- AUDIT_LOG
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    field_changed VARCHAR(50),
    old_value VARCHAR(500),
    new_value VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id)
);
CREATE INDEX IF NOT EXISTS idx_audit_problem_id ON audit_log(fast_problem_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_problem_timestamp ON audit_log(fast_problem_id, timestamp);

-- FAST_PROBLEM_REGION (multi-region: APAC, EMEA, AMER)
CREATE TABLE IF NOT EXISTS fast_problem_region (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    regional_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_fpr_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE,
    CONSTRAINT uq_fast_problem_region UNIQUE (fast_problem_id, regional_code)
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_region_code ON fast_problem_region(regional_code);
CREATE INDEX IF NOT EXISTS idx_fast_problem_region_problem_id ON fast_problem_region(fast_problem_id);

-- FAST_PROBLEM_PROPERTY
CREATE TABLE IF NOT EXISTS fast_problem_property (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    property_key VARCHAR(255) NOT NULL,
    property_value CLOB,
    CONSTRAINT fk_fpp_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE,
    CONSTRAINT uq_fast_problem_property UNIQUE (fast_problem_id, property_key)
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_property_problem_id ON fast_problem_property(fast_problem_id);

-- FAST_PROBLEM_LINK
CREATE TABLE IF NOT EXISTS fast_problem_link (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    label VARCHAR(100) NOT NULL,
    url VARCHAR(2000) NOT NULL,
    CONSTRAINT fk_fpl_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_link_problem_id ON fast_problem_link(fast_problem_id);

-- TICKET_COMMENT
CREATE TABLE IF NOT EXISTS ticket_comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    author_username VARCHAR(50) NOT NULL,
    comment_text CLOB NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tc_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ticket_comment_problem_id ON ticket_comment(fast_problem_id);

-- APP_SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value CLOB,
    description VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Local only: seed users for all roles (auth via X-Authenticated-User header). Username must match LDAP/login.
-- ADMIN (laks), REVIEWER (siresh), APPROVER (vivek), RTB_OWNER (kostas), TECH_LEAD (prav), READ_ONLY (rick)
INSERT INTO users (username, brid, email, full_name, role, region, active) VALUES
('admin', 'BR001', 'admin@enterprise.com', 'System Admin', 'ADMIN', 'AMER', true),
('laks', 'BR002', 'laks@enterprise.com', 'Laks', 'ADMIN', 'AMER', true),
('siresh', 'BR003', 'siresh@enterprise.com', 'Siresh', 'REVIEWER', 'AMER', true),
('vivek', 'BR004', 'vivek@enterprise.com', 'Vivek', 'APPROVER', 'AMER', true),
('kostas', 'BR005', 'kostas@enterprise.com', 'Kostas', 'RTB_OWNER', 'AMER', true),
('prav', 'BR006', 'prav@enterprise.com', 'Prav', 'TECH_LEAD', 'AMER', true),
('rick', 'BR007', 'rick@enterprise.com', 'Rick', 'READ_ONLY', 'AMER', true);

-- Seed applications (local)
INSERT INTO applications (name, code, description) VALUES
('Customer Portal', 'CP', 'Customer-facing web portal'),
('Order Management', 'OM', 'Order processing and fulfillment'),
('Payment Gateway', 'PG', 'Payment processing service'),
('Inventory Service', 'INV', 'Inventory and stock management'),
('Reporting Dashboard', 'RPT', 'Analytics and reporting');

-- Link users to applications (admin/laks: all; others: sample assignments)
INSERT INTO user_application (user_id, application_id) SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'admin' AND a.code IN ('CP', 'OM', 'PG');
INSERT INTO user_application (user_id, application_id) SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'laks' AND a.code IN ('CP', 'OM', 'PG', 'INV', 'RPT');
INSERT INTO user_application (user_id, application_id) SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'prav' AND a.code IN ('CP', 'INV');
INSERT INTO user_application (user_id, application_id) SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'kostas' AND a.code IN ('OM', 'RPT');
