#!/usr/bin/env python3
"""Generate 100 seed tickets and region rows for init-h2.sql."""
import sys

def esc(s):
    return (s or "").replace("'", "''")

apps = [
    "Payment Gateway", "Order Management", "Inventory System", "CRM", "HR Portal",
    "Finance Suite", "Shipping Service", "Customer Support", "Analytics Dashboard",
    "Reporting Engine", "Auth Service", "Notification Service", "Search Index",
    "API Gateway", "Config Service",
]
regions = ["APAC", "EMEA", "AMER"]
statuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "ROOT_CAUSE_IDENTIFIED", "FIX_IN_PROGRESS", "RESOLVED", "CLOSED"]
classes = ["A", "R", "P"]

lines = []
for i in range(1, 101):
    app = apps[(i - 1) % len(apps)]
    status = statuses[(i - 1) % len(statuses)]
    cls = classes[(i - 1) % len(classes)]
    inc = f"INC{1000 + i}" if i % 3 else None
    prb = f"PRB{2000 + i}" if i % 4 else None
    pbt = f"PBT-{3000 + i}"
    title = f"Issue in {app} - performance/outage #{i}"
    desc = f"Description for ticket {i}: users reporting issues with {app}. Investigation required."
    impact = (i % 50) + 1
    benefits = f"Improved stability and user experience for {app}."
    age = i % 30
    priority = 1 + (i % 4)
    target_hrs = [2, 4, 8, 24][(i - 1) % 4]
    api_status = ["MANUAL_ENTRY", "API_SYNCED", "MANUAL_ENTRY"][(i - 1) % 3]
    root = f"Root cause for ticket {i} (config or dependency)." if status in ("RESOLVED", "CLOSED") else None
    work = "Workaround: use alternate endpoint or retry." if status in ("IN_PROGRESS", "RESOLVED", "CLOSED") else None
    perm = "Permanent fix deployed." if status == "CLOSED" else None
    assigned = "admin" if status != "NEW" else None
    assigned_s = "NULL" if not assigned else "'admin'"
    group = "Platform Team" if i % 2 else "App Support"
    confluence = f"https://wiki.example.com/ticket-{i}" if i % 5 == 0 else None
    day_off = (i - 1) % 100
    created_ts = f"DATEADD('DAY', -{day_off}, CURRENT_TIMESTAMP)"
    updated_ts = f"DATEADD('DAY', -{max(0, day_off - 2)}, CURRENT_TIMESTAMP)"
    resolved = f", DATEADD('DAY', -{max(0, day_off - 5)}, CURRENT_TIMESTAMP)" if status in ("RESOLVED", "CLOSED") else ", NULL"
    inc_s = f"'{inc}'" if inc else "NULL"
    prb_s = f"'{prb}'" if prb else "NULL"
    root_s = f"'{esc(root)}'" if root else "NULL"
    work_s = f"'{esc(work)}'" if work else "NULL"
    perm_s = f"'{esc(perm)}'" if perm else "NULL"
    conf_s = f"'{esc(confluence)}'" if confluence else "NULL"
    row = f"({inc_s}, {prb_s}, '{pbt}', '{esc(title)}', '{esc(desc)}', {impact}, '{esc(app)}', '{esc(benefits)}', '{cls}', {age}, 'R16', '{status}', {priority * 0.25}, {priority}, {target_hrs}, '{api_status}', {root_s}, {work_s}, {perm_s}, 'admin', {assigned_s}, '{esc(group)}', {conf_s}, {created_ts}, {updated_ts}{resolved}, false)"
    lines.append(row)

# fast_problem INSERT (all columns except id)
cols = """servicenow_incident_number, servicenow_problem_number, pbt_id, title, description,
    user_impact_count, affected_application, anticipated_benefits, classification, ticket_age_days,
    status_indicator, status, priority_score, priority, target_resolution_hours, api_integration_status,
    root_cause, workaround, permanent_fix, created_by, assigned_to, assignment_group, confluence_link,
    created_date, updated_date, resolved_date, deleted"""
print("-- 100 seed tickets (different applications and regions); regions in fast_problem_region below.")
print("INSERT INTO fast_problem (" + cols.replace("\\n", " ") + ") VALUES")
print(",\n".join(lines))
print(";")

# fast_problem_region: ticket 1 -> id 1, etc. (after users we have 1 user; first fast_problem gets id 1)
region_rows = []
for i in range(1, 101):
    # 1, 2, or 3 regions per ticket
    n = 1 + (i % 3)
    for j in range(n):
        reg = regions[(i + j) % 3]
        region_rows.append(f"({i}, '{reg}')")
print("\nINSERT INTO fast_problem_region (fast_problem_id, regional_code) VALUES")
print(",\n".join(region_rows))
print(";")
