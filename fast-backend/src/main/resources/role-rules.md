# Role rules – Who can do what

This page describes the FAST application roles and their permissions. The backend enforces these rules in `SecurityConfig.java`.

## Roles and permissions

| Role | Create ticket | Edit ticket | Update status | Delete ticket | Submit for approval | Approve/Reject | View approvals | Update KB article | Register user | Settings | Audit log |
|------|----------------|-------------|----------------|---------------|----------------------|----------------|----------------|-------------------|---------------|----------|-----------|
| **ADMIN** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **REVIEWER** | No | No | No | No | No | Yes | Yes | No | No | No | No |
| **APPROVER** | No | No | No | No | No | Yes | Yes | No | No | No | No |
| **RTB_OWNER** | No | Yes | Yes | No | No | Yes | Yes | Yes | No | No | No |
| **TECH_LEAD** | No | Yes | Yes | No | No | No | Yes | Yes | No | No | No |
| **READ_ONLY** | No | No | No | No | No | No | No | No | No | No | No |

## Summary

- **ADMIN**: Full access; creates and clones tickets, submits for approval, edits, deletes, approves, manages users and settings, views audit log.
- **REVIEWER** / **APPROVER**: Approve or reject tickets in the approval queue; view tickets and Knowledge Base.
- **RTB_OWNER**: Approve/reject, assign tickets, edit tickets, move status, update KB.
- **TECH_LEAD**: Edit tickets, move status, update KB articles.
- **READ_ONLY**: View Dashboard, Tickets, and Knowledge Base only. No create, edit, approve, or admin features.

All authenticated users (including READ_ONLY) can use GET endpoints (dashboard, tickets, knowledge, own profile). Write operations are restricted by role as above.
