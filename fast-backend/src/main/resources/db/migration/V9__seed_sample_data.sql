-- Seed Users (LDAP authenticated - no passwords needed)
INSERT INTO users (username, brid, password, email, full_name, role, region, active) VALUES
('admin', 'BR001', NULL, 'admin@enterprise.com', 'System Admin', 'ADMIN', 'USDS', true),
('siresh', 'BR002', NULL, 'siresh@enterprise.com', 'Siresh S.', 'REVIEWER', 'USDS', true),
('vivek', 'BR003', NULL, 'vivek@enterprise.com', 'Vivek K.', 'REVIEWER', 'UM', true),
('kostas', 'BR004', NULL, 'kostas@enterprise.com', 'Kostas M.', 'APPROVER', 'JPL', true),
('approver_john', 'BR005', NULL, 'john@enterprise.com', 'John IT Approver', 'APPROVER', 'USDS', true),
('tech_alice', 'BR006', NULL, 'alice@enterprise.com', 'Alice Tech Lead', 'TECH_LEAD', 'USDS', true),
('rtb_bob', 'BR007', NULL, 'bob@enterprise.com', 'Bob RTB Owner', 'RTB_OWNER', 'USDS', true);

-- Seed FAST Problem Tickets
INSERT INTO fast_problem (servicenow_incident_number, servicenow_problem_number, pbt_id, title, description, user_impact_count, affected_application, anticipated_benefits, classification, regional_code, ticket_age_days, status_indicator, status, priority_score, target_resolution_hours, api_integration_status, created_by, assigned_to, assignment_group, created_date) VALUES
('INC0045678', 'PRB0012345', 'PBT-2026-00456', 'SAP ERP Batch Job Failures Affecting Payroll Processing', 'Multiple batch jobs failing during payroll processing cycle causing delays in employee payments across the Finance department.', 850, 'SAP ERP', 'Elimination of manual payroll processing workaround (120 hours/month), prevention of payment delays', 'A', 'USDS', 3, 'R16', 'NEW', 511.2, 4, 'MANUAL_ENTRY', 'admin', NULL, 'USDS-Problem-Team', CURRENT_TIMESTAMP),
('INC0056789', 'PRB0023456', 'PBT-2026-00789', 'CRM System Performance Degradation During Peak Hours', 'CRM response times exceeding 30 seconds during business hours 9AM-5PM EST, affecting sales team productivity.', 200, 'Salesforce CRM', 'Restore sub-3-second response times, recover estimated $50K monthly productivity loss', 'A', 'UM', 5, 'R16', 'ASSIGNED', 121.2, 4, 'MANUAL_ENTRY', 'admin', 'tech_alice', 'UM-Problem-Team', CURRENT_TIMESTAMP),
('INC0067890', 'PRB0034567', 'PBT-2026-01012', 'Email Gateway Intermittent Failures', 'Exchange Online connector dropping connections intermittently causing email delivery delays of 2-4 hours.', 5000, 'Exchange Online', 'Eliminate email delivery delays, improve communication reliability for entire organization', 'R', 'USDS', 12, 'R16', 'IN_PROGRESS', 3001.2, 4, 'MANUAL_ENTRY', 'admin', 'tech_alice', 'USDS-Problem-Team', CURRENT_TIMESTAMP),
('INC0078901', 'PRB0045678', 'PBT-2026-01345', 'Database Replication Lag in JPL Region', 'Primary to secondary database replication lag exceeding 30 minutes during peak transaction periods.', 150, 'Oracle DB Cluster', 'Reduce replication lag to under 1 minute, prevent data inconsistencies in disaster recovery', 'P', 'JPL', 25, 'R16', 'ROOT_CAUSE_IDENTIFIED', 91.2, 4, 'MANUAL_ENTRY', 'admin', 'tech_alice', 'JPL-Problem-Team', CURRENT_TIMESTAMP),
('INC0089012', 'PRB0056789', 'PBT-2026-01678', 'Authentication Service Timeout in CHN Region', 'SSO authentication service timing out for CHN region users during morning login surge 8-9AM CST.', 3000, 'Okta SSO', 'Eliminate morning login failures, restore SSO reliability for CHN workforce', 'A', 'CHN', 2, 'R16', 'NEW', 1801.2, 4, 'MANUAL_ENTRY', 'admin', NULL, 'CHN-Problem-Team', CURRENT_TIMESTAMP);

-- Seed Approval Records
INSERT INTO approval_record (fast_problem_id, reviewer_name, reviewer_email, decision, comments, decision_date, created_date) VALUES
(2, 'vivek', 'vivek@enterprise.com', 'APPROVED', 'Approved - high impact on sales team productivity.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'siresh', 'siresh@enterprise.com', 'APPROVED', 'Critical email infrastructure issue, fast-track approved.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Incident Links
INSERT INTO incident_link (fast_problem_id, incident_number, link_type, description) VALUES
(1, 'INC0045678', 'CAUSED_BY', 'Primary incident that identified the batch job failure pattern'),
(1, 'INC0045679', 'RELATED_TO', 'Follow-up incident for manual payroll processing'),
(3, 'INC0067890', 'CAUSED_BY', 'Initial report of email delivery delays'),
(3, 'INC0067891', 'RELATED_TO', 'Related incident from European office reporting same issue');

-- Seed Audit Logs
INSERT INTO audit_log (fast_problem_id, action, performed_by, field_changed, old_value, new_value) VALUES
(1, 'CREATED', 'admin', NULL, NULL, NULL),
(2, 'CREATED', 'admin', NULL, NULL, NULL),
(2, 'STATUS_CHANGED', 'vivek', 'status', 'NEW', 'ASSIGNED'),
(3, 'CREATED', 'admin', NULL, NULL, NULL),
(3, 'STATUS_CHANGED', 'siresh', 'status', 'NEW', 'ASSIGNED'),
(3, 'STATUS_CHANGED', 'tech_alice', 'status', 'ASSIGNED', 'IN_PROGRESS');
