CREATE TABLE knowledge_article (
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

CREATE INDEX idx_knowledge_status ON knowledge_article(status);
