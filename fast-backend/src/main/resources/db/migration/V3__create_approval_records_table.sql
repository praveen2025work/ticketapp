CREATE TABLE approval_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    reviewer_name VARCHAR(100) NOT NULL,
    reviewer_email VARCHAR(100),
    decision VARCHAR(20) DEFAULT 'PENDING',
    comments CLOB,
    decision_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id)
);

CREATE INDEX idx_approval_problem_id ON approval_record(fast_problem_id);
CREATE INDEX idx_approval_decision ON approval_record(decision);
