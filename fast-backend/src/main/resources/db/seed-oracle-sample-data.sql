-- =============================================================================
-- FAST - Oracle sample seed data (users, apps, user groups, sample tickets)
-- =============================================================================
-- Optional for dev/UAT demo environments only.
-- Do NOT use in production with real ticket data.
-- Run as schema owner after init-oracle.sql has created tables.
-- =============================================================================

-- Users
MERGE INTO users u
USING (
    SELECT 'admin' username,  'BR001' brid, 'admin@enterprise.com' email,  'Thenmozi' full_name,        'ADMIN' role,           'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'laks' username,   'BR002' brid, 'laks@enterprise.com' email,   'Lakshamana' full_name,      'ADMIN' role,           'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'siresh' username, 'BR003' brid, 'siresh@enterprise.com' email, 'Suresh' full_name,          'REVIEWER' role,        'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'vivek' username,  'BR004' brid, 'vivek@enterprise.com' email,  'Vivek' full_name,           'APPROVER' role,        'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'kostas' username, 'BR005' brid, 'kostas@enterprise.com' email, 'Kostas' full_name,          'RTB_OWNER' role,       'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'prav' username,   'BR006' brid, 'prav@enterprise.com' email,   'praveen' full_name,         'TECH_LEAD' role,       'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'rick' username,   'BR007' brid, 'rick@enterprise.com' email,   'Sujith' full_name,          'READ_ONLY' role,       'AMER' region, 1 active FROM dual UNION ALL
    SELECT 'pm' username,     'BR008' brid, 'pm@enterprise.com' email,     'Project Manager' full_name, 'PROJECT_MANAGER' role, 'AMER' region, 1 active FROM dual
) s
ON (LOWER(u.username) = LOWER(s.username))
WHEN MATCHED THEN UPDATE SET
    u.brid = s.brid,
    u.email = s.email,
    u.full_name = s.full_name,
    u.role = s.role,
    u.region = s.region,
    u.active = s.active,
    u.updated_date = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
    username, brid, email, full_name, role, region, active, created_date, updated_date
) VALUES (
    s.username, s.brid, s.email, s.full_name, s.role, s.region, s.active, SYSTIMESTAMP, SYSTIMESTAMP
);

-- Applications
MERGE INTO applications a
USING (
    SELECT 'MOTIF' name, 'MOTIF' code, 'Source system' description FROM dual UNION ALL
    SELECT 'RADIAL' name, 'RADIAL' code, 'Source system' description FROM dual UNION ALL
    SELECT 'SAP' name, 'SAP' code, 'Source system' description FROM dual UNION ALL
    SELECT 'FLEX' name, 'FLEX' code, 'Source system' description FROM dual UNION ALL
    SELECT 'Finstore/EDP' name, 'FINSTORE_EDP' code, 'Source system' description FROM dual UNION ALL
    SELECT 'RecFactory' name, 'RECFACTORY' code, 'Source system' description FROM dual UNION ALL
    SELECT 'Playpen' name, 'PLAYPEN' code, 'Source system' description FROM dual UNION ALL
    SELECT 'Workflow Engine' name, 'WORKFLOW_ENGINE' code, 'Source system' description FROM dual UNION ALL
    SELECT 'FAS' name, 'FAS' code, 'Source system' description FROM dual UNION ALL
    SELECT 'FinPortal' name, 'FINPORTAL' code, 'Source system' description FROM dual UNION ALL
    SELECT 'Download Center' name, 'DOWNLOAD_CENTER' code, 'Source system' description FROM dual
) s
ON (a.name = s.name)
WHEN MATCHED THEN UPDATE SET
    a.code = s.code,
    a.description = s.description,
    a.updated_date = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
    name, code, description, created_date, updated_date
) VALUES (
    s.name, s.code, s.description, SYSTIMESTAMP, SYSTIMESTAMP
);

-- Impacted user-group catalog
UPDATE user_group
SET code = 'PC_PRODUCER',
    name = 'Product Control Producer',
    description = 'Product control producer user group',
    updated_date = SYSTIMESTAMP
WHERE code = 'CLIENT_SVC';

UPDATE user_group
SET code = 'PC_APPROVER',
    name = 'Product Control Approver',
    description = 'Product control approver user group',
    updated_date = SYSTIMESTAMP
WHERE code = 'EXEC';

MERGE INTO user_group ug
USING (
    SELECT 'Product Control Producer' name, 'PC_PRODUCER' code, 'Product control producer user group' description, 1 active FROM dual UNION ALL
    SELECT 'Product Control Approver' name, 'PC_APPROVER' code, 'Product control approver user group' description, 1 active FROM dual UNION ALL
    SELECT 'Finance Control Producer' name, 'FIN_CTRL_PRODUCER' code, 'Finance control producer user group' description, 1 active FROM dual UNION ALL
    SELECT 'Finance Control Approver' name, 'FIN_CTRL' code, 'Finance control approver user group' description, 1 active FROM dual UNION ALL
    SELECT 'Operations Users' name, 'OPS' code, 'Operational users handling day-to-day processing' description, 1 active FROM dual
) s
ON (ug.code = s.code)
WHEN MATCHED THEN UPDATE SET
    ug.name = s.name,
    ug.description = s.description,
    ug.active = s.active,
    ug.updated_date = SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT (
    name, code, description, active, created_date, updated_date
) VALUES (
    s.name, s.code, s.description, s.active, SYSTIMESTAMP, SYSTIMESTAMP
);

-- User to application assignments
INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON 1 = 1
WHERE u.username = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON 1 = 1
WHERE u.username = 'laks'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON a.code IN ('FINPORTAL', 'DOWNLOAD_CENTER')
WHERE u.username = 'siresh'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON a.code IN ('MOTIF', 'RADIAL', 'SAP')
WHERE u.username = 'vivek'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON a.code IN ('WORKFLOW_ENGINE', 'RECFACTORY', 'FAS')
WHERE u.username = 'kostas'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON a.code IN ('PLAYPEN', 'WORKFLOW_ENGINE', 'RECFACTORY', 'FAS')
WHERE u.username = 'prav'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON a.code IN ('FINSTORE_EDP', 'FINPORTAL', 'DOWNLOAD_CENTER')
WHERE u.username = 'pm'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM users u
JOIN applications a ON a.code IN ('FAS', 'DOWNLOAD_CENTER')
WHERE u.username = 'rick'
AND NOT EXISTS (
    SELECT 1 FROM user_application ua WHERE ua.user_id = u.id AND ua.application_id = a.id
);

-- Re-seed only known demo tickets (idempotent)
DELETE FROM fast_problem
WHERE servicenow_incident_number IN ('INC-FAST-1001', 'INC-FAST-1002', 'INC-FAST-1003', 'INC-FAST-1004', 'INC-FAST-1005');

INSERT INTO fast_problem (
    servicenow_incident_number,
    servicenow_problem_number,
    pbt_id,
    title,
    description,
    user_impact_count,
    affected_application,
    request_number,
    dq_reference,
    impacted_user_group_notes,
    anticipated_benefits,
    classification,
    ticket_age_days,
    rag_status,
    status_indicator,
    status,
    priority_score,
    priority,
    target_resolution_hours,
    api_integration_status,
    root_cause,
    workaround,
    permanent_fix,
    created_by,
    assigned_to,
    assignment_group,
    btb_tech_lead_username,
    confluence_link,
    created_date,
    updated_date,
    resolved_date,
    deleted,
    archived
) VALUES
(
    'INC-FAST-1001', 'PRB-FAST-2001', 'PBT-4001',
    'MOTIF to RecFactory reconciliation variance',
    'Daily reconciliation shows mismatch for one AMER desk.',
    24, 'RecFactory', 'REQ-FAST-1001', 'DQ-1001',
    'Finance controllers impacted during reconciliation window.',
    'Reduce manual reconciliation effort.',
    'A', 2, 'G', 'R16', 'BACKLOG', 14.0, 2, 4, 'MANUAL_ENTRY',
    NULL, NULL, NULL,
    'admin', NULL, 'AMER-Problem-Team', NULL, NULL,
    SYSTIMESTAMP - INTERVAL '2' DAY,
    SYSTIMESTAMP - INTERVAL '2' DAY,
    NULL,
    0, 0
);

INSERT INTO fast_problem (
    servicenow_incident_number,
    servicenow_problem_number,
    pbt_id,
    title,
    description,
    user_impact_count,
    affected_application,
    request_number,
    dq_reference,
    impacted_user_group_notes,
    anticipated_benefits,
    classification,
    ticket_age_days,
    rag_status,
    status_indicator,
    status,
    priority_score,
    priority,
    target_resolution_hours,
    api_integration_status,
    root_cause,
    workaround,
    permanent_fix,
    created_by,
    assigned_to,
    assignment_group,
    btb_tech_lead_username,
    confluence_link,
    created_date,
    updated_date,
    resolved_date,
    deleted,
    archived
) VALUES
(
    'INC-FAST-1002', 'PRB-FAST-2002', 'PBT-4002',
    'SAP feed delay for month-end extract',
    'Month-end export is delayed due to source ingest lag.',
    8, 'SAP', 'REQ-FAST-1002', 'DQ-1002',
    'Operations users are waiting for delayed data loads.',
    'Avoid reporting delays.',
    'R', 4, 'G', 'R16', 'ASSIGNED', 6.0, 3, 8, 'MANUAL_ENTRY',
    NULL, NULL, NULL,
    'admin', 'pm', 'EMEA-Problem-Team', NULL, NULL,
    SYSTIMESTAMP - INTERVAL '4' DAY,
    SYSTIMESTAMP - INTERVAL '1' DAY,
    NULL,
    0, 0
);

INSERT INTO fast_problem (
    servicenow_incident_number,
    servicenow_problem_number,
    pbt_id,
    title,
    description,
    user_impact_count,
    affected_application,
    request_number,
    dq_reference,
    impacted_user_group_notes,
    anticipated_benefits,
    classification,
    ticket_age_days,
    rag_status,
    status_indicator,
    status,
    priority_score,
    priority,
    target_resolution_hours,
    api_integration_status,
    root_cause,
    workaround,
    permanent_fix,
    created_by,
    assigned_to,
    assignment_group,
    btb_tech_lead_username,
    confluence_link,
    created_date,
    updated_date,
    resolved_date,
    deleted,
    archived
) VALUES
(
    'INC-FAST-1003', 'PRB-FAST-2003', 'PBT-4003',
    'Workflow Engine alert rule tuning',
    'Alerting logic is noisy and requires threshold updates.',
    5, 'Workflow Engine', 'REQ-FAST-1003', 'DQ-1003',
    'Client service team receives repetitive false-positive alerts.',
    'Improve signal quality for support.',
    'P', 6, 'G', 'R16', 'ACCEPTED', 4.0, 3, 8, 'MANUAL_ENTRY',
    NULL, NULL, NULL,
    'admin', 'kostas', 'AMER-Problem-Team', 'prav', NULL,
    SYSTIMESTAMP - INTERVAL '6' DAY,
    SYSTIMESTAMP - INTERVAL '1' DAY,
    NULL,
    0, 0
);

INSERT INTO fast_problem (
    servicenow_incident_number,
    servicenow_problem_number,
    pbt_id,
    title,
    description,
    user_impact_count,
    affected_application,
    request_number,
    dq_reference,
    impacted_user_group_notes,
    anticipated_benefits,
    classification,
    ticket_age_days,
    rag_status,
    status_indicator,
    status,
    priority_score,
    priority,
    target_resolution_hours,
    api_integration_status,
    root_cause,
    workaround,
    permanent_fix,
    created_by,
    assigned_to,
    assignment_group,
    btb_tech_lead_username,
    confluence_link,
    created_date,
    updated_date,
    resolved_date,
    deleted,
    archived
) VALUES
(
    'INC-FAST-1004', 'PRB-FAST-2004', 'PBT-4004',
    'Playpen access sync with FinPortal',
    'Some users are not syncing correctly after role updates.',
    12, 'Playpen', 'REQ-FAST-1004', 'DQ-1004',
    'Executive stakeholders are tracking repeated access exceptions.',
    'Reduce access-related tickets.',
    'A', 9, 'G', 'R16', 'IN_PROGRESS', 9.0, 2, 6, 'MANUAL_ENTRY',
    'Provisioning job mapping issue.',
    'Manual role refresh for impacted users.',
    NULL,
    'admin', 'prav', 'APAC-Problem-Team', 'prav',
    'https://confluence.local/fast/playpen-sync',
    SYSTIMESTAMP - INTERVAL '9' DAY,
    SYSTIMESTAMP - INTERVAL '6' HOUR,
    NULL,
    0, 0
);

INSERT INTO fast_problem (
    servicenow_incident_number,
    servicenow_problem_number,
    pbt_id,
    title,
    description,
    user_impact_count,
    affected_application,
    request_number,
    dq_reference,
    impacted_user_group_notes,
    anticipated_benefits,
    classification,
    ticket_age_days,
    rag_status,
    status_indicator,
    status,
    priority_score,
    priority,
    target_resolution_hours,
    api_integration_status,
    root_cause,
    workaround,
    permanent_fix,
    created_by,
    assigned_to,
    assignment_group,
    btb_tech_lead_username,
    confluence_link,
    created_date,
    updated_date,
    resolved_date,
    deleted,
    archived
) VALUES
(
    'INC-FAST-1005', 'PRB-FAST-2005', 'PBT-4005',
    'RADIAL extract format correction',
    'Download Center output schema mismatch fixed in latest run.',
    3, 'RADIAL', 'REQ-FAST-1005', 'DQ-1005',
    'Small operations cohort impacted by schema mismatch.',
    'Stabilize downstream reporting loads.',
    'R', 1, 'G', 'B16', 'RESOLVED', 2.0, 4, 4, 'MANUAL_ENTRY',
    'Column ordering drift in export template.',
    'Use prior template while patch is deployed.',
    'Template mapping fixed and validated.',
    'admin', 'pm', 'EMEA-Problem-Team', 'prav', NULL,
    SYSTIMESTAMP - INTERVAL '1' DAY,
    SYSTIMESTAMP,
    SYSTIMESTAMP,
    0, 0
);

INSERT INTO fast_problem_region (fast_problem_id, regional_code)
SELECT fp.id, 'AMER'
FROM fast_problem fp
WHERE fp.servicenow_incident_number = 'INC-FAST-1001'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_region r WHERE r.fast_problem_id = fp.id AND r.regional_code = 'AMER'
);

INSERT INTO fast_problem_region (fast_problem_id, regional_code)
SELECT fp.id, 'EMEA'
FROM fast_problem fp
WHERE fp.servicenow_incident_number = 'INC-FAST-1002'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_region r WHERE r.fast_problem_id = fp.id AND r.regional_code = 'EMEA'
);

INSERT INTO fast_problem_region (fast_problem_id, regional_code)
SELECT fp.id, 'AMER'
FROM fast_problem fp
WHERE fp.servicenow_incident_number = 'INC-FAST-1003'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_region r WHERE r.fast_problem_id = fp.id AND r.regional_code = 'AMER'
);

INSERT INTO fast_problem_region (fast_problem_id, regional_code)
SELECT fp.id, 'APAC'
FROM fast_problem fp
WHERE fp.servicenow_incident_number = 'INC-FAST-1004'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_region r WHERE r.fast_problem_id = fp.id AND r.regional_code = 'APAC'
);

INSERT INTO fast_problem_region (fast_problem_id, regional_code)
SELECT fp.id, 'EMEA'
FROM fast_problem fp
WHERE fp.servicenow_incident_number = 'INC-FAST-1005'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_region r WHERE r.fast_problem_id = fp.id AND r.regional_code = 'EMEA'
);

INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT fp.id, a.id
FROM fast_problem fp
JOIN applications a ON a.code IN ('MOTIF', 'RECFACTORY')
WHERE fp.servicenow_incident_number = 'INC-FAST-1001'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_application fpa WHERE fpa.fast_problem_id = fp.id AND fpa.application_id = a.id
);

INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT fp.id, a.id
FROM fast_problem fp
JOIN applications a ON a.code IN ('SAP')
WHERE fp.servicenow_incident_number = 'INC-FAST-1002'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_application fpa WHERE fpa.fast_problem_id = fp.id AND fpa.application_id = a.id
);

INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT fp.id, a.id
FROM fast_problem fp
JOIN applications a ON a.code IN ('WORKFLOW_ENGINE')
WHERE fp.servicenow_incident_number = 'INC-FAST-1003'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_application fpa WHERE fpa.fast_problem_id = fp.id AND fpa.application_id = a.id
);

INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT fp.id, a.id
FROM fast_problem fp
JOIN applications a ON a.code IN ('PLAYPEN', 'FINPORTAL')
WHERE fp.servicenow_incident_number = 'INC-FAST-1004'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_application fpa WHERE fpa.fast_problem_id = fp.id AND fpa.application_id = a.id
);

INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT fp.id, a.id
FROM fast_problem fp
JOIN applications a ON a.code IN ('RADIAL', 'DOWNLOAD_CENTER')
WHERE fp.servicenow_incident_number = 'INC-FAST-1005'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_application fpa WHERE fpa.fast_problem_id = fp.id AND fpa.application_id = a.id
);

INSERT INTO fast_problem_user_group (fast_problem_id, user_group_id)
SELECT fp.id, ug.id
FROM fast_problem fp
JOIN user_group ug ON ug.code IN ('FIN_CTRL')
WHERE fp.servicenow_incident_number = 'INC-FAST-1001'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_user_group x WHERE x.fast_problem_id = fp.id AND x.user_group_id = ug.id
);

INSERT INTO fast_problem_user_group (fast_problem_id, user_group_id)
SELECT fp.id, ug.id
FROM fast_problem fp
JOIN user_group ug ON ug.code IN ('OPS')
WHERE fp.servicenow_incident_number = 'INC-FAST-1004'
AND NOT EXISTS (
    SELECT 1 FROM fast_problem_user_group x WHERE x.fast_problem_id = fp.id AND x.user_group_id = ug.id
);

-- Sample interview schedule sheet (Product Control)
DELETE FROM interview_schedule_entry
WHERE interview_schedule_id IN (
    SELECT id
    FROM interview_schedule
    WHERE business_area = 'Rates'
      AND interviewed_by = 'Thenmozi'
      AND interview_date = TRUNC(SYSDATE - 1)
);

DELETE FROM interview_schedule_entry
WHERE interview_schedule_id IN (
    SELECT id
    FROM interview_schedule
    WHERE business_area = 'Finance Control'
      AND interviewed_by = 'Thenmozi'
      AND interview_date = TRUNC(SYSDATE - 2)
);

DELETE FROM interview_schedule
WHERE business_area = 'Rates'
  AND interviewed_by = 'Thenmozi'
  AND interview_date = TRUNC(SYSDATE - 1);

DELETE FROM interview_schedule
WHERE business_area = 'Finance Control'
  AND interviewed_by = 'Thenmozi'
  AND interview_date = TRUNC(SYSDATE - 2);

INSERT INTO interview_schedule (
    business_area,
    pc_director,
    product_controller,
    named_pnls,
    location,
    interviewed_by,
    interview_date,
    created_by,
    updated_by,
    created_date,
    updated_date
) VALUES (
    'Rates',
    'Lakshamana',
    'Suresh',
    'Rates Spot; Rates Forward',
    'London',
    'Thenmozi',
    TRUNC(SYSDATE - 1),
    'admin',
    'admin',
    SYSTIMESTAMP - INTERVAL '1' DAY,
    SYSTIMESTAMP
);

INSERT INTO interview_schedule (
    business_area,
    pc_director,
    product_controller,
    named_pnls,
    location,
    interviewed_by,
    interview_date,
    created_by,
    updated_by,
    created_date,
    updated_date
) VALUES (
    'Finance Control',
    'Lakshamana',
    'praveen',
    'Rates Options; Rates Swaps',
    'New York',
    'Thenmozi',
    TRUNC(SYSDATE - 2),
    'admin',
    'admin',
    SYSTIMESTAMP - INTERVAL '2' DAY,
    SYSTIMESTAMP
);

INSERT INTO interview_schedule_entry (
    interview_schedule_id,
    time_slot,
    display_order,
    business_function,
    applications_used,
    process_improvements,
    tech_issues_to_resolve,
    ticket_raised
)
SELECT s.id, v.time_slot, v.display_order, v.business_function, v.applications_used, v.process_improvements, v.tech_issues_to_resolve, v.ticket_raised
FROM interview_schedule s
JOIN (
    SELECT '08:00' AS time_slot, 0 AS display_order, 'Morning controls check' AS business_function, 'MOTIF; RecFactory' AS applications_used, 'Automate checklist reminders' AS process_improvements, 'Manual refresh needed for overnight feeds' AS tech_issues_to_resolve, 'INC-FAST-2008' AS ticket_raised FROM dual
    UNION ALL SELECT '09:00', 1, 'Trade capture validation', 'SAP; FinPortal', 'Reduce duplicate validation steps', 'Latency in SAP extract', 'INC-FAST-2009' FROM dual
    UNION ALL SELECT '10:00', 2, 'PnL explain preparation', 'FinPortal; Download Center', 'Template standardization', 'Intermittent CSV format mismatch', 'INC-FAST-2010' FROM dual
    UNION ALL SELECT '11:00', 3, 'Break / ad-hoc queries', NULL, NULL, NULL, NULL FROM dual
    UNION ALL SELECT '12:00', 4, 'Midday reconciliation', 'SAP; Workflow Engine', 'Auto-match more low value breaks', 'Exception queue timeout', 'INC-FAST-2011' FROM dual
    UNION ALL SELECT '13:00', 5, 'Variance investigation', 'RecFactory; FAS', 'Better issue categorization', 'Reference data delay', NULL FROM dual
    UNION ALL SELECT '14:00', 6, 'Product control sign-off prep', 'FinPortal', 'Pre-populate sign-off commentary', NULL, NULL FROM dual
    UNION ALL SELECT '15:00', 7, 'Data quality checks', 'Download Center', 'Add proactive DQ alerts', 'False-positive DQ alerts', 'INC-FAST-2012' FROM dual
    UNION ALL SELECT '16:00', 8, 'Finance control review', 'SAP', 'Consolidate reviewer notes', NULL, NULL FROM dual
    UNION ALL SELECT '17:00', 9, 'Exception management', 'Workflow Engine', 'Escalation matrix optimization', 'Ticket ownership not auto-assigned', 'INC-FAST-2013' FROM dual
    UNION ALL SELECT '18:00', 10, 'EOD PnL pack finalization', 'FinPortal; Playpen', 'Auto-publish final pack', 'Role sync issue for pack approvers', 'INC-FAST-2014' FROM dual
    UNION ALL SELECT '19:00', 11, 'Stakeholder updates', 'FinPortal', 'Single-click status summary', NULL, NULL FROM dual
    UNION ALL SELECT '20:00', 12, 'Handover notes', 'FAS', 'Structured handover template', NULL, NULL FROM dual
    UNION ALL SELECT '21:00', 13, 'Close of day checks', 'Workflow Engine', 'Auto-close completed checks', 'Delayed close confirmation events', 'INC-FAST-2015' FROM dual
) v ON 1 = 1
WHERE s.business_area = 'Rates'
  AND s.interviewed_by = 'Thenmozi'
  AND s.interview_date = TRUNC(SYSDATE - 1)
  AND NOT EXISTS (
      SELECT 1
      FROM interview_schedule_entry e
      WHERE e.interview_schedule_id = s.id
        AND e.time_slot = v.time_slot
  );

INSERT INTO interview_schedule_entry (
    interview_schedule_id,
    time_slot,
    display_order,
    business_function,
    applications_used,
    process_improvements,
    tech_issues_to_resolve,
    ticket_raised
)
SELECT s.id, v.time_slot, v.display_order, v.business_function, v.applications_used, v.process_improvements, v.tech_issues_to_resolve, v.ticket_raised
FROM interview_schedule s
JOIN (
    SELECT '08:00' AS time_slot, 0 AS display_order, 'SOD finance controls' AS business_function, 'FAS; FinPortal' AS applications_used, 'Auto-publish control checklist' AS process_improvements, 'Approval role mismatch in morning run' AS tech_issues_to_resolve, 'INC-FAST-2101' AS ticket_raised FROM dual
    UNION ALL SELECT '09:00', 1, 'Balance confirmations', 'MOTIF; SAP', 'Template with mandatory comments', 'Slow response from SAP balance endpoint', 'INC-FAST-2102' FROM dual
    UNION ALL SELECT '10:00', 2, 'Exception triage', 'Workflow Engine', 'Priority tags for control breaks', 'Ticket assignment delays for OPS', 'INC-FAST-2103' FROM dual
    UNION ALL SELECT '11:00', 3, 'Issue follow-up', 'FinPortal', 'Single owner view for escalations', NULL, NULL FROM dual
    UNION ALL SELECT '12:00', 4, 'Midday finance review', 'SAP; Download Center', 'Reduce manual export handling', 'Intermittent export timeout', 'INC-FAST-2104' FROM dual
    UNION ALL SELECT '13:00', 5, 'PnL commentary drafting', 'FinPortal', 'Reusable commentary snippets', NULL, NULL FROM dual
    UNION ALL SELECT '14:00', 6, 'Control attestations', 'FAS; Workflow Engine', 'Inline evidence upload', 'Attachment upload fails for some users', 'INC-FAST-2105' FROM dual
    UNION ALL SELECT '15:00', 7, 'Reconciliation reruns', 'RecFactory', 'Auto-rerun failed jobs', 'Manual rerun required after timeout', 'INC-FAST-2106' FROM dual
    UNION ALL SELECT '16:00', 8, 'Approver handoff', 'FinPortal', 'One-click approver summary', NULL, NULL FROM dual
    UNION ALL SELECT '17:00', 9, 'Open issue governance', 'Workflow Engine; FAS', 'SLA-based queue grouping', 'SLA alert triggers late', 'INC-FAST-2107' FROM dual
    UNION ALL SELECT '18:00', 10, 'Pre-EOD checks', 'SAP; FinPortal', 'Auto-validate EOD readiness', NULL, NULL FROM dual
    UNION ALL SELECT '19:00', 11, 'Final control review', 'FAS', 'Consolidated control status board', NULL, NULL FROM dual
    UNION ALL SELECT '20:00', 12, 'Handover prep', 'Download Center', 'Standardize handover output', 'CSV column order drift', 'INC-FAST-2108' FROM dual
    UNION ALL SELECT '21:00', 13, 'EOD close', 'Workflow Engine', 'Auto-close non-open exceptions', 'Close event delay in queue', 'INC-FAST-2109' FROM dual
) v ON 1 = 1
WHERE s.business_area = 'Finance Control'
  AND s.interviewed_by = 'Thenmozi'
  AND s.interview_date = TRUNC(SYSDATE - 2)
  AND NOT EXISTS (
      SELECT 1
      FROM interview_schedule_entry e
      WHERE e.interview_schedule_id = s.id
        AND e.time_slot = v.time_slot
  );

UPDATE fast_problem SET rag_status = 'A' WHERE ticket_age_days > 15 AND ticket_age_days <= 20 AND deleted = 0;
UPDATE fast_problem SET rag_status = 'R' WHERE ticket_age_days > 20 AND deleted = 0;

COMMIT;
