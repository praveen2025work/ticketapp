CREATE TABLE incident_link (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fast_problem_id BIGINT NOT NULL,
    incident_number VARCHAR(20) NOT NULL,
    link_type VARCHAR(20) DEFAULT 'RELATED_TO',
    description VARCHAR(500),
    linked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incident_problem FOREIGN KEY (fast_problem_id) REFERENCES fast_problem(id)
);

CREATE INDEX idx_incident_link_problem_id ON incident_link(fast_problem_id);
CREATE INDEX idx_incident_link_number ON incident_link(incident_number);
