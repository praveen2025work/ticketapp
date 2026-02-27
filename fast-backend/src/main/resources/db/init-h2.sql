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

-- USER_GROUP (admin-managed impacted user group catalog)
CREATE TABLE IF NOT EXISTS user_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50),
    description VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_group_name ON user_group(name);
CREATE INDEX IF NOT EXISTS idx_user_group_active ON user_group(active);

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
    dq_reference VARCHAR(100),
    impacted_user_group_notes CLOB,
    anticipated_benefits CLOB,
    classification VARCHAR(10) DEFAULT 'A',
    ticket_age_days INTEGER DEFAULT 0,
    rag_status VARCHAR(5) DEFAULT 'G',
    status_indicator VARCHAR(10) DEFAULT 'R16',
    status VARCHAR(30) DEFAULT 'BACKLOG',
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
    in_progress_date TIMESTAMP,
    closed_date TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_status ON fast_problem(status);
CREATE INDEX IF NOT EXISTS idx_fast_problem_classification ON fast_problem(classification);
CREATE INDEX IF NOT EXISTS idx_fast_problem_rag_status ON fast_problem(rag_status);
CREATE INDEX IF NOT EXISTS idx_fast_problem_pbt_id ON fast_problem(pbt_id);
CREATE INDEX IF NOT EXISTS idx_fast_problem_inc_number ON fast_problem(servicenow_incident_number);
CREATE INDEX IF NOT EXISTS idx_fast_problem_prb_number ON fast_problem(servicenow_problem_number);
CREATE INDEX IF NOT EXISTS idx_fast_problem_created_date ON fast_problem(created_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_deleted ON fast_problem(deleted);
CREATE INDEX IF NOT EXISTS idx_fast_problem_deleted_created ON fast_problem(deleted, created_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_affected_app ON fast_problem(affected_application);
CREATE INDEX IF NOT EXISTS idx_fast_problem_request_number ON fast_problem(request_number);
CREATE INDEX IF NOT EXISTS idx_fast_problem_dq_reference ON fast_problem(dq_reference);
CREATE INDEX IF NOT EXISTS idx_fast_problem_resolved_date ON fast_problem(resolved_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_closed_date ON fast_problem(closed_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_archived ON fast_problem(archived);
CREATE INDEX IF NOT EXISTS idx_fast_problem_updated_date ON fast_problem(updated_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_assigned_to ON fast_problem(assigned_to);

-- FAST_PROBLEM_APPLICATION (ticket can impact one-to-many applications)
CREATE TABLE IF NOT EXISTS fast_problem_application (
    fast_problem_id BIGINT NOT NULL,
    application_id BIGINT NOT NULL,
    PRIMARY KEY (fast_problem_id, application_id),
    CONSTRAINT fk_fpa_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_fpa_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_application_app ON fast_problem_application(application_id);

-- FAST_PROBLEM_USER_GROUP (ticket can impact one-to-many user groups)
CREATE TABLE IF NOT EXISTS fast_problem_user_group (
    fast_problem_id BIGINT NOT NULL,
    user_group_id BIGINT NOT NULL,
    PRIMARY KEY (fast_problem_id, user_group_id),
    CONSTRAINT fk_fpug_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id) ON DELETE CASCADE,
    CONSTRAINT fk_fpug_user_group FOREIGN KEY (user_group_id) REFERENCES user_group(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fast_problem_user_group_group ON fast_problem_user_group(user_group_id);

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
    link_type VARCHAR(20) DEFAULT 'OTHER',
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
CREATE INDEX IF NOT EXISTS idx_ticket_comment_problem_created ON ticket_comment(fast_problem_id, created_date);

-- APP_SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value CLOB,
    description VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Local only: seed users for all roles (auth via X-Authenticated-User header). Username must match LDAP/login.
INSERT INTO users (username, brid, email, full_name, role, region, active) VALUES
('admin', 'BR001', 'admin@enterprise.com', 'Thenmozi', 'ADMIN', 'AMER', true),
('laks', 'BR002', 'laks@enterprise.com', 'Lakshamana', 'ADMIN', 'AMER', true),
('siresh', 'BR003', 'siresh@enterprise.com', 'Suresh', 'REVIEWER', 'AMER', true),
('vivek', 'BR004', 'vivek@enterprise.com', 'Vivek', 'APPROVER', 'AMER', true),
('kostas', 'BR005', 'kostas@enterprise.com', 'Kostas', 'RTB_OWNER', 'AMER', true),
('prav', 'BR006', 'prav@enterprise.com', 'praveen', 'TECH_LEAD', 'AMER', true),
('rick', 'BR007', 'rick@enterprise.com', 'Sujith', 'READ_ONLY', 'AMER', true),
('pm', 'BR008', 'pm@enterprise.com', 'Project Manager', 'PROJECT_MANAGER', 'AMER', true);

-- Seed applications (local) from fast_sample_data.json -> reference_data.source_systems
INSERT INTO applications (name, code, description) VALUES
('MOTIF', 'MOTIF', 'Source system'),
('RADIAL', 'RADIAL', 'Source system'),
('SAP', 'SAP', 'Source system'),
('FLEX', 'FLEX', 'Source system'),
('Finstore/EDP', 'FINSTORE_EDP', 'Source system'),
('RecFactory', 'RECFACTORY', 'Source system'),
('Playpen', 'PLAYPEN', 'Source system'),
('Workflow Engine', 'WORKFLOW_ENGINE', 'Source system'),
('FAS', 'FAS', 'Source system'),
('FinPortal', 'FINPORTAL', 'Source system'),
('Download Center', 'DOWNLOAD_CENTER', 'Source system');

-- Seed impacted user groups (local)
INSERT INTO user_group (name, code, description, active) VALUES
('Product Control Producer', 'PC_PRODUCER', 'Product control producer user group', true),
('Product Control Approver', 'PC_APPROVER', 'Product control approver user group', true),
('Finance Control Producer', 'FIN_CTRL_PRODUCER', 'Finance control producer user group', true),
('Finance Control Approver', 'FIN_CTRL', 'Finance control approver user group', true),
('Operations Users', 'OPS', 'Operational users handling day-to-day processing', true);

-- Link users to applications (admin/laks: all; others: simple assignments)
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'admin';
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'laks';
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'siresh' AND a.code IN ('FINPORTAL', 'DOWNLOAD_CENTER');
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'vivek' AND a.code IN ('MOTIF', 'RADIAL', 'SAP');
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'kostas' AND a.code IN ('WORKFLOW_ENGINE', 'RECFACTORY', 'FAS');
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'prav' AND a.code IN ('PLAYPEN', 'WORKFLOW_ENGINE', 'RECFACTORY', 'FAS');
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'pm' AND a.code IN ('FINSTORE_EDP', 'FINPORTAL', 'DOWNLOAD_CENTER');
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id FROM users u, applications a WHERE u.username = 'rick' AND a.code IN ('FAS', 'DOWNLOAD_CENTER');
