CREATE TABLE fast_problem (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    servicenow_incident_number VARCHAR(20),
    servicenow_problem_number VARCHAR(20),
    pbt_id VARCHAR(30),
    title VARCHAR(255) NOT NULL,
    description CLOB,
    user_impact_count INTEGER DEFAULT 0,
    affected_application VARCHAR(100),
    anticipated_benefits CLOB,
    classification VARCHAR(10) DEFAULT 'A',
    regional_code VARCHAR(10) NOT NULL,
    ticket_age_days INTEGER DEFAULT 0,
    status_indicator VARCHAR(10) DEFAULT 'R16',
    status VARCHAR(30) DEFAULT 'NEW',
    priority_score DOUBLE DEFAULT 0.0,
    target_resolution_hours INTEGER DEFAULT 4,
    api_integration_status VARCHAR(20) DEFAULT 'MANUAL_ENTRY',
    root_cause CLOB,
    workaround CLOB,
    permanent_fix CLOB,
    created_by VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(50),
    assignment_group VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_fast_problem_status ON fast_problem(status);
CREATE INDEX idx_fast_problem_classification ON fast_problem(classification);
CREATE INDEX idx_fast_problem_regional_code ON fast_problem(regional_code);
CREATE INDEX idx_fast_problem_pbt_id ON fast_problem(pbt_id);
CREATE INDEX idx_fast_problem_inc_number ON fast_problem(servicenow_incident_number);
CREATE INDEX idx_fast_problem_prb_number ON fast_problem(servicenow_problem_number);
