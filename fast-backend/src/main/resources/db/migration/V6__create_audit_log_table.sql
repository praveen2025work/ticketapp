CREATE TABLE audit_log (
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

CREATE INDEX idx_audit_problem_id ON audit_log(fast_problem_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
