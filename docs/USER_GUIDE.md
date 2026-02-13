# FAST – User Guide  
**Finance – Accelerated Support Team – Problem Management System**

This guide explains how to use the FAST application so you can work without asking for help. Keep it handy and share it with your team.

---

## Table of contents

1. [What is FAST?](#1-what-is-fast)
2. [Logging in](#2-logging-in)
3. [Main navigation](#3-main-navigation)
4. [Roles and what you can do](#4-roles-and-what-you-can-do)
5. [Dashboard](#5-dashboard)
6. [Problem tickets](#6-problem-tickets)
7. [Creating a ticket](#7-creating-a-ticket)
8. [Ticket detail and lifecycle](#8-ticket-detail-and-lifecycle)
9. [Approvals](#9-approvals)
10. [Knowledge Base](#10-knowledge-base)
11. [Audit Log (Admins)](#11-audit-log-admins)
12. [Exporting data](#12-exporting-data)
13. [Logging out](#13-logging-out)

---

## 1. What is FAST?

FAST is a **problem ticket system**. It is used to:

- **Record** problems (incidents, outages, issues) as tickets
- **Track** each ticket through statuses (e.g. New → In progress → Root cause identified → Resolved → Closed)
- **Get approvals** from reviewers before closing
- **Reuse solutions** via the Knowledge Base (articles created from resolved tickets)

You use the same app for viewing the dashboard, managing tickets, doing approvals, and searching the Knowledge Base. What you see and can do depends on your **role**.

---

## 2. Logging in

- **Production / Dev:** You do **not** see a login page. You are signed in automatically with your company account (BAM / Windows). If you see “Authentication required”, you are not signed in with the right account—use the same way you access other internal apps.
- **Local / development:** If the app is running on localhost, a small user switcher may appear in the header so developers can simulate different users. Normal users in dev/prod never see this.

After you are authenticated, you land on the **Dashboard**.

---

## 3. Main navigation

At the top of the page you have:

| Link | What it does |
|------|----------------|
| **FAST** | Logo; click to go to Dashboard |
| **Dashboard** | Summary metrics and charts; quick view of tickets |
| **Tickets** | Full list of problem tickets; search and filters |
| **Create Ticket** | Open the form to create a new problem ticket |
| **Approvals** | List of tickets waiting for your approval (if you are a Reviewer or Admin) |
| **Knowledge Base** | Searchable list of knowledge articles from resolved problems |
| **Audit Log** | Only for **Admins**: history of who did what in the system |

On the right you see your name (or display name), role badge, and **Logout**.

---

## 4. Roles and what you can do

| Role | Can do |
|------|--------|
| **ADMIN** | Everything: create/edit/delete tickets, move statuses, approve/reject, view Audit Log, manage data. |
| **RTB_TEAM** | Create tickets, submit tickets for approval, view everything. |
| **SERVICE_DESK** | Same as RTB_TEAM (create tickets, submit for approval, view). |
| **REVIEWER** | Approve or reject tickets that are in the approval queue. View tickets and Knowledge Base. |
| **PROBLEM_MANAGER** | Edit tickets, move status (e.g. to Resolved/Closed), view and use everything except Audit Log. |
| **TECHNICIAN** | Same as Problem Manager: edit tickets, move status, view tickets and Knowledge Base. |
| **READ_ONLY** | View Dashboard, Tickets, and Knowledge Base only. No create, edit, approve, or Audit Log. |

If you don’t see a menu item (e.g. “Create Ticket” or “Audit Log”), your role doesn’t have permission. You can still use the parts of the app that are visible to you.

---

## 5. Dashboard

The **Dashboard** gives a high-level view.

- **Metric cards** at the top: e.g. total open tickets, resolved, closed, average resolution time, SLA compliance. You can filter by **All**, **Open**, **Resolved**, or **Closed** to change the numbers and the list below.
- **Charts**: e.g. tickets by classification, region, status, aging.
- **Ticket table**: A list of tickets (all or filtered). Click a row to open the **Ticket detail** page.

Use the Dashboard to see how many problems are open, how fast they’re being resolved, and to jump into a specific ticket.

---

## 6. Problem tickets

**Tickets** → shows all problem tickets in a table.

- **Search:** Use the search box to find tickets by text (e.g. title, description).
- **Filters:** You can filter by:
  - **Region** (e.g. APAC, EMEA, AMER)
  - **Classification** (A, R, P)
  - **Application** (affected application)
  - **Date range** (from / to)
- **Pagination:** Use “Previous” / “Next” or page numbers at the bottom to move through pages.
- **Export:** Click **Export** to download a CSV of tickets (respecting current filters). Useful for reports or offline analysis.

Clicking a ticket row opens the **Ticket detail** page.

---

## 7. Creating a ticket

Only **RTB_TEAM**, **SERVICE_DESK**, and **ADMIN** can create tickets.

1. Go to **Create Ticket** in the top menu.
2. Fill in the form:
   - **Title** (required)
   - **Description**
   - **Regional code** (e.g. APAC, EMEA, AMER)
   - **Target resolution hours**
   - **Priority** (if used)
   - **Assigned to**, **Assignment group**
   - Optional: ServiceNow incident/problem numbers, PBT ID, affected application, anticipated benefits, Confluence link, etc.
3. Click **Submit** (or the main submit button on the form).

You are then taken to the new ticket’s **detail** page. The ticket starts in status **NEW**.

---

## 8. Ticket detail and lifecycle

On a ticket’s detail page you see:

- **Title**, **ID**, **status**, and a **status timeline** (e.g. New → Assigned → In progress → … → Resolved → Closed).
- **Problem details**: description, anticipated benefits.
- **Resolution details**: root cause, workaround, permanent fix (filled in as the ticket is worked).
- **Approval history**: who approved or rejected and when.
- **Knowledge article** (if one was created when the ticket was resolved).
- **Incident links** (if any).

**Aging:** If a ticket is open for a long time (e.g. 20+ days) and not Resolved/Closed, an “Aging ticket” warning is shown so it can be prioritized.

**Buttons you may see (depending on your role):**

- **Submit for Approval**  
  - Visible when the ticket is **NEW** and you are RTB_TEAM, SERVICE_DESK, or ADMIN.  
  - Use this when the ticket is ready for a Reviewer to approve. It moves the ticket into the approval process.

- **Move to &lt;next status&gt;**  
  - Visible for TECHNICIAN, PROBLEM_MANAGER, or ADMIN.  
  - Moves the ticket to the next step, e.g.  
    **Assigned** → **In progress** → **Root cause identified** → **Fix in progress** → **Resolved** → **Closed**.

- **Edit**  
  - TECHNICIAN, PROBLEM_MANAGER, or ADMIN can open the **Edit** form to change title, description, root cause, workaround, permanent fix, assignment, Confluence link, etc.

**Lifecycle in short:**  
Create (NEW) → Submit for approval → Reviewer approves → Technician/PM moves through statuses and fills root cause/workaround/permanent fix → **Resolved** → **Closed**. When a ticket is marked **Resolved**, the system can automatically create a **Knowledge Base** article from it (see below).

---

## 9. Approvals

**Approvals** is for **REVIEWER** and **ADMIN**.

- You see a list of tickets that are **pending your approval**.
- For each item you see ticket summary, who submitted it, and actions:
  - **Approve** – you can add a comment, then confirm. The ticket moves forward in the process.
  - **Reject** – you can add a comment, then confirm. The ticket does not move to the next stage.
- You can open the full ticket (e.g. “View ticket” or by navigating to the ticket) to see all details before approving or rejecting.

Use this page whenever you need to approve or reject problem tickets as a reviewer.

---

## 10. Knowledge Base

### What are Knowledge Base articles?

**Knowledge Base articles** are reusable documents created **from resolved problem tickets**. Each article captures:

- **Title** (usually based on the problem title)
- **Root cause** – what caused the problem
- **Workaround** – what users can do temporarily
- **Permanent fix** – what was done to fix it for good
- **Category** (often the affected application)
- **Status** – e.g. DRAFT or PUBLISHED

They are **not** written from scratch in the Knowledge Base. They are **auto-created** when a problem ticket is moved to **Resolved**. So:

1. A ticket is worked (root cause, workaround, permanent fix are filled on the ticket).
2. Someone with the right role moves the ticket to **Resolved**.
3. The system creates a Knowledge Base article from that ticket’s data.
4. The article appears under **Knowledge Base** and can be updated (e.g. title, category, status) if your app allows it.

**Why use the Knowledge Base?**

- To **find past solutions** when a similar issue happens again.
- To **share** root cause, workaround, and permanent fix with support and other teams.
- To **avoid re-solving** the same problem from scratch.

**How to use the Knowledge Base page**

- Open **Knowledge Base** in the top menu.
- You see a **list of articles** (title, category, status, created date).
- **Click a row** (or the expand control) to open the details: Root cause, Workaround, Permanent fix, and the linked problem ticket ID.
- If the list is empty, the message explains that articles are created when problems are resolved.

You can use search/filters on the Tickets page to find the **ticket** that generated an article; the article also shows “Problem #&lt;id&gt;” so you can trace back.

---

## 11. Audit Log (Admins)

Only **ADMIN** sees **Audit Log** in the menu.

- The Audit Log shows **who did what and when** (e.g. ticket created, status changed, approved, rejected).
- You can **filter by action** (type of event) and **by user** (who performed it).
- Use it for compliance, troubleshooting, and understanding how tickets were handled.

---

## 12. Exporting data

On the **Tickets** page:

- Set any **filters** you want (region, classification, application, dates, search).
- Click **Export**.
- A **CSV file** is downloaded with the tickets that match the current filters (up to the limit supported by the app, e.g. 1000). You can open it in Excel or another tool for reporting.

---

## 13. Logging out

Click **Logout** in the top-right. You are signed out; in production/dev you may be redirected or the page may reload so you can sign in again with BAM/Windows if needed.

---

## Quick reference

| I want to… | Where to go | Who can do it |
|------------|-------------|----------------|
| See overview of tickets and metrics | Dashboard | All |
| See all tickets and search/filter | Tickets | All |
| Create a new problem | Create Ticket | RTB_TEAM, SERVICE_DESK, ADMIN |
| Work on a ticket (edit, move status) | Ticket detail → Edit / Move to … | TECHNICIAN, PROBLEM_MANAGER, ADMIN |
| Submit a ticket for approval | Ticket detail → Submit for Approval | RTB_TEAM, SERVICE_DESK, ADMIN |
| Approve or reject a ticket | Approvals | REVIEWER, ADMIN |
| Find past solutions | Knowledge Base | All |
| See who did what | Audit Log | ADMIN only |
| Download tickets for reporting | Tickets → Export | All (with access to Tickets) |

---

*If something in the app doesn’t match this guide (e.g. a new role or button), ask your FAST admin or project lead for an updated version of this document.*
