-- Minimal sample tickets (keep simple: 5 records)
INSERT INTO fast_problem (
    servicenow_incident_number,
    servicenow_problem_number,
    pbt_id,
    title,
    description,
    user_impact_count,
    affected_application,
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
    'INC-FAST-1001',
    'PRB-FAST-2001',
    'PBT-4001',
    'MOTIF to RecFactory reconciliation variance',
    'Daily reconciliation shows mismatch for one AMER desk.',
    24,
    'RecFactory',
    'Reduce manual reconciliation effort.',
    'A',
    2,
    'G',
    'R16',
    'BACKLOG',
    14.0,
    2,
    4,
    'MANUAL_ENTRY',
    NULL,
    NULL,
    NULL,
    'admin',
    NULL,
    'AMER-Problem-Team',
    NULL,
    NULL,
    DATEADD('DAY', -2, CURRENT_TIMESTAMP),
    DATEADD('DAY', -2, CURRENT_TIMESTAMP),
    NULL,
    false,
    false
),
(
    'INC-FAST-1002',
    'PRB-FAST-2002',
    'PBT-4002',
    'SAP feed delay for month-end extract',
    'Month-end export is delayed due to source ingest lag.',
    8,
    'SAP',
    'Avoid reporting delays.',
    'R',
    4,
    'G',
    'R16',
    'ASSIGNED',
    6.0,
    3,
    8,
    'MANUAL_ENTRY',
    NULL,
    NULL,
    NULL,
    'admin',
    'pm',
    'EMEA-Problem-Team',
    NULL,
    NULL,
    DATEADD('DAY', -4, CURRENT_TIMESTAMP),
    DATEADD('DAY', -1, CURRENT_TIMESTAMP),
    NULL,
    false,
    false
),
(
    'INC-FAST-1003',
    'PRB-FAST-2003',
    'PBT-4003',
    'Workflow Engine alert rule tuning',
    'Alerting logic is noisy and requires threshold updates.',
    5,
    'Workflow Engine',
    'Improve signal quality for support.',
    'P',
    6,
    'G',
    'R16',
    'ACCEPTED',
    4.0,
    3,
    8,
    'MANUAL_ENTRY',
    NULL,
    NULL,
    NULL,
    'admin',
    'kostas',
    'AMER-Problem-Team',
    'prav',
    NULL,
    DATEADD('DAY', -6, CURRENT_TIMESTAMP),
    DATEADD('DAY', -1, CURRENT_TIMESTAMP),
    NULL,
    false,
    false
),
(
    'INC-FAST-1004',
    'PRB-FAST-2004',
    'PBT-4004',
    'Playpen access sync with FinPortal',
    'Some users are not syncing correctly after role updates.',
    12,
    'Playpen',
    'Reduce access-related tickets.',
    'A',
    9,
    'G',
    'R16',
    'IN_PROGRESS',
    9.0,
    2,
    6,
    'MANUAL_ENTRY',
    'Provisioning job mapping issue.',
    'Manual role refresh for impacted users.',
    NULL,
    'admin',
    'prav',
    'APAC-Problem-Team',
    'prav',
    'https://confluence.local/fast/playpen-sync',
    DATEADD('DAY', -9, CURRENT_TIMESTAMP),
    DATEADD('HOUR', -6, CURRENT_TIMESTAMP),
    NULL,
    false,
    false
),
(
    'INC-FAST-1005',
    'PRB-FAST-2005',
    'PBT-4005',
    'RADIAL extract format correction',
    'Download Center output schema mismatch fixed in latest run.',
    3,
    'RADIAL',
    'Stabilize downstream reporting loads.',
    'R',
    1,
    'G',
    'B16',
    'RESOLVED',
    2.0,
    4,
    4,
    'MANUAL_ENTRY',
    'Column ordering drift in export template.',
    'Use prior template while patch is deployed.',
    'Template mapping fixed and validated.',
    'admin',
    'pm',
    'EMEA-Problem-Team',
    'prav',
    NULL,
    DATEADD('DAY', -1, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    false,
    false
);

INSERT INTO fast_problem_region (fast_problem_id, regional_code) VALUES
(1, 'AMER'),
(2, 'EMEA'),
(3, 'AMER'),
(4, 'APAC'),
(5, 'EMEA');

INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT 1, id FROM applications WHERE code IN ('MOTIF', 'RECFACTORY');
INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT 2, id FROM applications WHERE code IN ('SAP');
INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT 3, id FROM applications WHERE code IN ('WORKFLOW_ENGINE');
INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT 4, id FROM applications WHERE code IN ('PLAYPEN', 'FINPORTAL');
INSERT INTO fast_problem_application (fast_problem_id, application_id)
SELECT 5, id FROM applications WHERE code IN ('RADIAL', 'DOWNLOAD_CENTER');

INSERT INTO fast_problem_user_group (fast_problem_id, user_group_id)
SELECT 1, id FROM user_group WHERE code IN ('FIN_CTRL');
INSERT INTO fast_problem_user_group (fast_problem_id, user_group_id)
SELECT 4, id FROM user_group WHERE code IN ('OPS');

-- Sample interview schedule sheet (Product Control)
DELETE FROM interview_schedule_entry;
DELETE FROM interview_schedule;

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
    DATEADD('DAY', -1, CURRENT_DATE),
    'admin',
    'admin',
    DATEADD('DAY', -1, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
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
    DATEADD('DAY', -2, CURRENT_DATE),
    'admin',
    'admin',
    DATEADD('DAY', -2, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
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
    SELECT '08:00' AS time_slot, 0 AS display_order, 'Morning controls check' AS business_function, 'MOTIF; RecFactory' AS applications_used, 'Automate checklist reminders' AS process_improvements, 'Manual refresh needed for overnight feeds' AS tech_issues_to_resolve, 'INC-FAST-2008' AS ticket_raised
    UNION ALL SELECT '09:00', 1, 'Trade capture validation', 'SAP; FinPortal', 'Reduce duplicate validation steps', 'Latency in SAP extract', 'INC-FAST-2009'
    UNION ALL SELECT '10:00', 2, 'PnL explain preparation', 'FinPortal; Download Center', 'Template standardization', 'Intermittent CSV format mismatch', 'INC-FAST-2010'
    UNION ALL SELECT '11:00', 3, 'Break / ad-hoc queries', NULL, NULL, NULL, NULL
    UNION ALL SELECT '12:00', 4, 'Midday reconciliation', 'SAP; Workflow Engine', 'Auto-match more low value breaks', 'Exception queue timeout', 'INC-FAST-2011'
    UNION ALL SELECT '13:00', 5, 'Variance investigation', 'RecFactory; FAS', 'Better issue categorization', 'Reference data delay', NULL
    UNION ALL SELECT '14:00', 6, 'Product control sign-off prep', 'FinPortal', 'Pre-populate sign-off commentary', NULL, NULL
    UNION ALL SELECT '15:00', 7, 'Data quality checks', 'Download Center', 'Add proactive DQ alerts', 'False-positive DQ alerts', 'INC-FAST-2012'
    UNION ALL SELECT '16:00', 8, 'Finance control review', 'SAP', 'Consolidate reviewer notes', NULL, NULL
    UNION ALL SELECT '17:00', 9, 'Exception management', 'Workflow Engine', 'Escalation matrix optimization', 'Ticket ownership not auto-assigned', 'INC-FAST-2013'
    UNION ALL SELECT '18:00', 10, 'EOD PnL pack finalization', 'FinPortal; Playpen', 'Auto-publish final pack', 'Role sync issue for pack approvers', 'INC-FAST-2014'
    UNION ALL SELECT '19:00', 11, 'Stakeholder updates', 'FinPortal', 'Single-click status summary', NULL, NULL
    UNION ALL SELECT '20:00', 12, 'Handover notes', 'FAS', 'Structured handover template', NULL, NULL
    UNION ALL SELECT '21:00', 13, 'Close of day checks', 'Workflow Engine', 'Auto-close completed checks', 'Delayed close confirmation events', 'INC-FAST-2015'
) v ON 1 = 1
WHERE s.business_area = 'Rates'
  AND s.interviewed_by = 'Thenmozi';

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
    SELECT '08:00' AS time_slot, 0 AS display_order, 'SOD finance controls' AS business_function, 'FAS; FinPortal' AS applications_used, 'Auto-publish control checklist' AS process_improvements, 'Approval role mismatch in morning run' AS tech_issues_to_resolve, 'INC-FAST-2101' AS ticket_raised
    UNION ALL SELECT '09:00', 1, 'Balance confirmations', 'MOTIF; SAP', 'Template with mandatory comments', 'Slow response from SAP balance endpoint', 'INC-FAST-2102'
    UNION ALL SELECT '10:00', 2, 'Exception triage', 'Workflow Engine', 'Priority tags for control breaks', 'Ticket assignment delays for OPS', 'INC-FAST-2103'
    UNION ALL SELECT '11:00', 3, 'Issue follow-up', 'FinPortal', 'Single owner view for escalations', NULL, NULL
    UNION ALL SELECT '12:00', 4, 'Midday finance review', 'SAP; Download Center', 'Reduce manual export handling', 'Intermittent export timeout', 'INC-FAST-2104'
    UNION ALL SELECT '13:00', 5, 'PnL commentary drafting', 'FinPortal', 'Reusable commentary snippets', NULL, NULL
    UNION ALL SELECT '14:00', 6, 'Control attestations', 'FAS; Workflow Engine', 'Inline evidence upload', 'Attachment upload fails for some users', 'INC-FAST-2105'
    UNION ALL SELECT '15:00', 7, 'Reconciliation reruns', 'RecFactory', 'Auto-rerun failed jobs', 'Manual rerun required after timeout', 'INC-FAST-2106'
    UNION ALL SELECT '16:00', 8, 'Approver handoff', 'FinPortal', 'One-click approver summary', NULL, NULL
    UNION ALL SELECT '17:00', 9, 'Open issue governance', 'Workflow Engine; FAS', 'SLA-based queue grouping', 'SLA alert triggers late', 'INC-FAST-2107'
    UNION ALL SELECT '18:00', 10, 'Pre-EOD checks', 'SAP; FinPortal', 'Auto-validate EOD readiness', NULL, NULL
    UNION ALL SELECT '19:00', 11, 'Final control review', 'FAS', 'Consolidated control status board', NULL, NULL
    UNION ALL SELECT '20:00', 12, 'Handover prep', 'Download Center', 'Standardize handover output', 'CSV column order drift', 'INC-FAST-2108'
    UNION ALL SELECT '21:00', 13, 'EOD close', 'Workflow Engine', 'Auto-close non-open exceptions', 'Close event delay in queue', 'INC-FAST-2109'
) v ON 1 = 1
WHERE s.business_area = 'Finance Control'
  AND s.interviewed_by = 'Thenmozi';

UPDATE fast_problem SET rag_status = 'A' WHERE ticket_age_days > 15 AND ticket_age_days <= 20 AND deleted = false;
UPDATE fast_problem SET rag_status = 'R' WHERE ticket_age_days > 20 AND deleted = false;
