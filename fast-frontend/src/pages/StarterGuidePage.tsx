import { Link } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { MermaidDiagram } from '../components/MermaidDiagram';

const ROLES = [
  { role: 'ADMIN', desc: 'Full access: create/clone tickets, submit for approval, edit, delete, close tickets, register users, settings, Audit Log.' },
  { role: 'REVIEWER', desc: 'Business Review Owner. Approve or reject tickets (is it a FAST issue?). Can only approve tickets linked to their applications.' },
  { role: 'APPROVER', desc: 'IT Review Owner. Approve or reject tickets (IT approval). Can only approve tickets linked to their applications.' },
  { role: 'RTB_OWNER', desc: 'RTB Lead. Approve/reject, assign tickets, edit tickets, move status, update KB articles. Can only approve tickets linked to their applications.' },
  { role: 'TECH_LEAD', desc: 'BTB Lead. Owns technical fix, edits tickets, moves status, update KB articles.' },
  { role: 'PROJECT_MANAGER', desc: 'Tracks upstream items (JIRA, ServiceFirst links). Edit tickets, move status.' },
  { role: 'READ_ONLY', desc: 'Read-only access: view Dashboard, Tickets, and Knowledge Base. No clicks or actions except Export data (CSV).' },
];

const QUICK_REF = [
  { want: 'See overview of tickets and metrics (SLA, avg resolution)', where: 'Dashboard', who: 'All' },
  { want: 'See all tickets, search and filter (default: 45 days)', where: 'Tickets', who: 'All' },
  { want: 'View archived tickets', where: 'Tickets → Status: ARCHIVED, or Dashboard → Archived card', who: 'All' },
  { want: 'Filter tickets by age, impact, or priority', where: 'Tickets → Age / Min Impact / Priority filters', who: 'All' },
  { want: 'Return to ticket list with filters preserved', where: 'Ticket detail → ← Back to Tickets', who: 'All' },
  { want: 'Create a new problem', where: 'Create Ticket', who: 'ADMIN' },
  { want: 'Clone an existing ticket', where: 'Ticket detail → Clone ticket', who: 'ADMIN' },
  { want: 'Work on a ticket (edit, move status)', where: 'Ticket detail → Edit / Move to…', who: 'ADMIN, RTB_OWNER, TECH_LEAD, PROJECT_MANAGER' },
  { want: 'Send email to assignee', where: 'Ticket detail → Send email to assignee (if enabled in Settings)', who: 'ADMIN, RTB_OWNER, TECH_LEAD, PROJECT_MANAGER' },
  { want: 'Submit a ticket for approval', where: 'Ticket detail → Submit for Approval', who: 'ADMIN' },
  { want: 'Approve or reject a ticket', where: 'Approvals', who: 'REVIEWER, APPROVER, RTB_OWNER, ADMIN (must be linked to ticket apps)' },
  { want: 'Find past solutions', where: 'Knowledge Base', who: 'All' },
  { want: 'Update a Knowledge Base article', where: 'Knowledge Base → expand article (edit if supported)', who: 'ADMIN, RTB_OWNER, TECH_LEAD' },
  { want: 'See who did what', where: 'Audit Log', who: 'ADMIN only' },
  { want: 'Manage app settings (incl. email, daily reports)', where: 'Admin → Settings', who: 'ADMIN only' },
  { want: 'Preview daily report email template', where: 'Admin → Settings → Daily Reports → Preview template', who: 'ADMIN only' },
  { want: 'Register or manage users', where: 'Admin → Users', who: 'ADMIN only' },
  { want: 'Download tickets (CSV)', where: 'Tickets → Export', who: 'All' },
  { want: 'Switch dark/light theme', where: 'Header → theme icon', who: 'All' },
];

export default function StarterGuidePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Starter Guide</h1>
        <p className="text-slate-600 mt-1">
          Finance – Accelerated Support Team – how to use the app without asking for help.
        </p>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">What is FAST?</h2>
        <p className="text-slate-700">
          FAST is a problem ticket system. You can record problems, track them through statuses (Backlog → Assigned → Accepted → In progress → Resolved → Closed),
          get approvals from reviewers, and reuse solutions from the Knowledge Base. Your menu and actions depend on your role.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Navigation</h2>
        <ul className="space-y-2 text-slate-700">
          <li><Link to="/dashboard" className="text-primary hover:underline font-medium">Dashboard</Link> – Open/Resolved/Closed/Archived counts, SLA compliance, avg resolution time, charts, quick ticket list</li>
          <li><Link to="/tickets" className="text-primary hover:underline font-medium">Tickets</Link> – full list, search, filters, export</li>
          <li><Link to="/tickets/create" className="text-primary hover:underline font-medium">Create Ticket</Link> – new problem (ADMIN)</li>
          <li><Link to="/approvals" className="text-primary hover:underline font-medium">Approvals</Link> – pending approvals (REVIEWER, APPROVER, RTB_OWNER, ADMIN)</li>
          <li><Link to="/knowledge" className="text-primary hover:underline font-medium">Knowledge Base</Link> – articles from resolved tickets, plus Role rules (who can do what)</li>
          <li><Link to="/admin" className="text-primary hover:underline font-medium">Admin</Link> – Settings and Users (ADMIN only)</li>
          <li><Link to="/audit" className="text-primary hover:underline font-medium">Audit Log</Link> – who did what (ADMIN only)</li>
        </ul>
        <p className="text-sm text-slate-500 mt-2">Use the book icon in the header for this Starter Guide. Use the theme icon to switch between light and dark mode.</p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Your role</h2>
        <p className="text-slate-600 text-sm mb-4">
          You are signed in as <span className="font-medium text-slate-800">{user?.displayName ?? user?.fullName ?? user?.username}</span>
          {' '}(<span className="px-2 py-0.5 bg-slate-200 rounded text-slate-700 text-xs font-medium">{user?.role}</span>).
        </p>
        <h3 className="text-sm font-medium text-slate-700 mb-2">What each role can do</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2 font-semibold text-slate-700">Role</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Can do</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-slate-800">{r.role}</td>
                  <td className="px-4 py-2 text-slate-600">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Ticket lifecycle</h2>
        <p className="text-slate-700 mb-3">
          Admin creates a ticket (BACKLOG) → Submits for approval → Reviewer, Approver, and RTB Owner approve (each role must approve) → All three must approve → ASSIGNED to Admin →
          RTB Owner assigns to Admin or Tech Lead → Based on approvals, ticket moves to ACCEPTED → Tech Lead/Admin works on fix (IN_PROGRESS → ROOT_CAUSE → FIX_IN_PROGRESS → RESOLVED) →
          Admin closes (CLOSED). From CLOSED or REJECTED, Admin can move to ARCHIVED. When a ticket is Resolved, a Knowledge Base article is auto-created. If any Reviewer, Approver, or RTB Owner rejects, the ticket moves to REJECTED. Admin can also Close or Reject a ticket from BACKLOG, ASSIGNED, or ACCEPTED.
        </p>
        <p className="text-slate-700 mb-3">
          At ACCEPTED stage, BTB follow-up starts. The ticket stays blocked from <strong>IN_PROGRESS</strong> until a <strong>BTB Technical Lead</strong> is manually assigned. FAST always shows accepted items in the Approval Queue and can send accepted-ticket email alerts when the setting is enabled.
        </p>
        <p className="text-slate-600 text-sm mb-3">
          <strong>Approval restriction:</strong> Only users linked to the ticket&apos;s Impacted applications (Admin → Users → Applications) can approve or reject that ticket. Admin can approve any ticket.
        </p>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Ownership and lifecycle map</h3>
          <MermaidDiagram
            id="ownership-lifecycle-map"
            chart={`flowchart LR
    A["BACKLOG<br/>Owner: ADMIN"] --> B["APPROVALS<br/>Owners: REVIEWER + APPROVER + RTB_OWNER"]
    B --> C["ASSIGNED<br/>Owner: RTB_OWNER"]
    C --> D["ACCEPTED<br/>Owner: RTB_OWNER (handover to BTB)"]
    D --> E{"BTB Tech Lead Assigned?"}
    E -->|No| F["Blocked: remain ACCEPTED<br/>Action: assign btbTechLeadUsername"]
    E -->|Yes| G["IN_PROGRESS<br/>Owner: TECH_LEAD"]
    G --> H["ROOT_CAUSE_IDENTIFIED<br/>Owner: TECH_LEAD"]
    H --> I["FIX_IN_PROGRESS<br/>Owner: TECH_LEAD"]
    I --> J["RESOLVED<br/>Owner: TECH_LEAD / PROJECT_MANAGER"]
    J --> K["CLOSED<br/>Owner: ADMIN"]
    K --> L["ARCHIVED<br/>Owner: ADMIN"]
    D -. "Optional email (setting enabled)" .-> M["BTB Tech Lead Notification"]
    D -. "Always visible" .-> N["Approval Queue: Accepted section"]`}
          />
        </div>
        <div className="overflow-x-auto mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Owner responsibilities by status</h3>
          <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Primary owner</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Key responsibility</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">BACKLOG</td>
                <td className="px-4 py-2 text-slate-600">ADMIN</td>
                <td className="px-4 py-2 text-slate-600">Create ticket, capture DQ reference, impacted apps, impacted user groups.</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">APPROVALS</td>
                <td className="px-4 py-2 text-slate-600">REVIEWER, APPROVER, RTB_OWNER</td>
                <td className="px-4 py-2 text-slate-600">Complete role-based approval and routing decision.</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">ASSIGNED</td>
                <td className="px-4 py-2 text-slate-600">RTB_OWNER</td>
                <td className="px-4 py-2 text-slate-600">Confirm assignee and prepare handover to BTB execution owner.</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">ACCEPTED</td>
                <td className="px-4 py-2 text-slate-600">RTB_OWNER + TECH_LEAD</td>
                <td className="px-4 py-2 text-slate-600">Assign BTB technical lead and acknowledge follow-up notification.</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">IN_PROGRESS / ROOT_CAUSE_IDENTIFIED / FIX_IN_PROGRESS</td>
                <td className="px-4 py-2 text-slate-600">TECH_LEAD</td>
                <td className="px-4 py-2 text-slate-600">Drive investigation, root cause, workaround, and permanent fix updates.</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">RESOLVED</td>
                <td className="px-4 py-2 text-slate-600">TECH_LEAD / PROJECT_MANAGER</td>
                <td className="px-4 py-2 text-slate-600">Validate fix completion and finalize resolution details for KB article.</td>
              </tr>
              <tr className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium text-slate-800">CLOSED / ARCHIVED</td>
                <td className="px-4 py-2 text-slate-600">ADMIN</td>
                <td className="px-4 py-2 text-slate-600">Close out and archive ticket for reporting and audit retention.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <span className="px-2 py-1 bg-slate-100 rounded">BACKLOG</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-100 rounded">ASSIGNED</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-100 rounded">ACCEPTED</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-100 rounded">IN_PROGRESS</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-100 rounded">ROOT_CAUSE_IDENTIFIED</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-100 rounded">FIX_IN_PROGRESS</span>
          <span>→</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded">RESOLVED</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-200 rounded">CLOSED</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-300 rounded">ARCHIVED</span>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Dashboard metrics (SLA &amp; completion)</h2>
        <p className="text-slate-700 mb-3">
          The Dashboard shows five summary cards: <strong>Open</strong>, <strong>Resolved</strong>, <strong>Closed</strong>, <strong>Archived</strong>, plus <strong>Avg Resolution</strong> and <strong>SLA Compliance</strong>. Clicking Open, Resolved, Closed, or Archived takes you to the ticket list filtered by that status.
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 mb-3">
          <li><strong>Avg Resolution:</strong> Average time (in hours) from ticket creation to resolution, for all resolved/closed tickets. Uses each ticket’s resolved date (or updated date if resolved date is missing). Target is 4 hours; you can set a per-ticket <strong>Target Resolution (Hours)</strong> when creating or editing a ticket.</li>
          <li><strong>SLA Compliance:</strong> Percentage of resolved/closed tickets that were resolved within their <strong>Target Resolution (Hours)</strong>. Only tickets that have a target set are included. Target is 80% — the card turns green when compliance is ≥80%.</li>
          <li><strong>Period filter:</strong> When you choose Weekly or Monthly on the Dashboard, Open/Resolved/Closed counts and charts are scoped to that period; Avg Resolution and SLA are computed over resolved tickets in that period.</li>
        </ul>
        <p className="text-slate-600 text-sm">
          Resolution time is measured from <em>created date</em> to <em>resolved date</em> (or updated date). Archived and deleted tickets are excluded from these metrics.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Dashboard &amp; Tickets</h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 mb-4">
          <li><strong>Dashboard filters:</strong> Filter by Application (matches Impacted applications on tickets), Region (APAC, EMEA, AMER), and period (Overall, Weekly, Monthly).</li>
          <li><strong>Tickets screen:</strong> Default date range is the last 45 days. Clear filters resets to that range.</li>
          <li><strong>Search:</strong> Case-insensitive search on INC, PRB, PBT ID, title, and description (e.g. &quot;gateway&quot; finds tickets with &quot;gateway&quot; in the title).</li>
          <li><strong>Filters:</strong> Region, Application, Classification, Status (including OPEN, ARCHIVED), RAG (escalation), From/To Date, Age (min/max days), Min Impact, Priority (1–5).</li>
          <li><strong>Back to Tickets:</strong> When viewing a ticket, &quot;← Back to Tickets&quot; preserves the filter state you had on the list.</li>
          <li><strong>Archived tickets:</strong> Closed tickets are auto-archived after 7 days and excluded from the default list. You can view them by choosing <strong>Status → ARCHIVED</strong> in the ticket list or by clicking the Archived card on the Dashboard. Admin can also move a CLOSED or REJECTED ticket to ARCHIVED manually.</li>
          <li><strong>RAG Status (Escalation):</strong> Green (≤15 days), Amber (15–20 days), Red (&gt;20 days). Updated daily for open tickets.</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Knowledge Base</h2>
        <p className="text-slate-700">
          Knowledge Base articles are created automatically when a problem ticket is moved to <strong>Resolved</strong>. They contain
          root cause, workaround, and permanent fix so you can reuse past solutions. Open <Link to="/knowledge" className="text-primary hover:underline">Knowledge Base</Link> to browse.
          At the top of the Knowledge Base page you’ll find <strong>Role rules – Who can do what</strong>, a clear table of permissions per role.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Email options & daily report template</h2>
        <p className="text-slate-700 mb-3">
          In <Link to="/admin" className="text-primary hover:underline font-medium">Admin → Settings</Link> (ADMIN only) you can configure:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 mb-3">
          <li><strong>Email (SMTP)</strong> – Host, port, username, password, and From address. Used for sending email to assignees and for daily reports.</li>
          <li><strong>Daily Reports</strong> – Enable globally and per zone (APAC, EMEA, AMER). Set send time (HH:mm) and comma-separated recipients for each zone. Use <strong>Preview template</strong> to view how the daily report email will look before sending.</li>
          <li><strong>Ticket Email</strong> – Toggle to allow or disable sending email to the assignee from the ticket detail page.</li>
          <li><strong>Accepted Ticket Email</strong> – Toggle to send BTB notification email when a ticket enters ACCEPTED.</li>
        </ul>
        <p className="text-slate-600 text-sm">
          The daily report template preview opens in a full-screen view. You can switch zone (APAC/EMEA/AMER), download the HTML, or copy it. Save settings after changing any email options.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Admin area (ADMIN only)</h2>
        <p className="text-slate-700 mb-3">
          From <Link to="/admin" className="text-primary hover:underline font-medium">Admin</Link> you can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li><strong>Settings</strong> – configure application settings, including email (SMTP), daily reports, and ticket email options. Use <strong>Preview template</strong> in Daily Reports to view the report email template.</li>
          <li><strong>Users</strong> – register new users and link them to applications. User–application mapping controls which approval tickets each user can approve.</li>
          <li><strong>Applications</strong> – manage Impacted applications used on tickets.</li>
          <li><strong>User Groups</strong> – manage impacted-user-group master data used in ticket capture and MI reporting.</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Latest changes</h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 mb-3">
          <li><strong>Unified deployment</strong> – Frontend and backend can be packaged as a single JAR. Run <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">mvn package</code>; the UI is built and served from Spring Boot on the same port.</li>
          <li><strong>AD auth flow (prod/dev/prod-h2)</strong> – The UI calls your AD API directly (Windows Auth), resolves the username, then sends it to the backend. The backend validates against the <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">users</code> table and issues a JWT. No BAM required.</li>
          <li><strong>Configurable AD URL</strong> – Set <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">adApiUrl</code> in <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">config.json</code> for the AD endpoint. Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">authMode: &quot;ad&quot;</code> for prod/dev/prod-h2.</li>
          <li><strong>Local unchanged</strong> – Local dev still uses X-Authenticated-User header and the dev user switcher. No AD call.</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Authentication &amp; tech details</h2>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Auth modes</h3>
        <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden mb-4">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-2 font-semibold text-slate-700">Environment</th>
              <th className="px-4 py-2 font-semibold text-slate-700">Auth mode</th>
              <th className="px-4 py-2 font-semibold text-slate-700">How it works</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-800">local</td><td className="px-4 py-2 text-slate-600">local</td><td className="px-4 py-2 text-slate-600">X-Authenticated-User header, dev user switcher. No AD.</td></tr>
            <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-800">prod, dev, prod-h2</td><td className="px-4 py-2 text-slate-600">ad</td><td className="px-4 py-2 text-slate-600">UI calls AD API (Windows Auth), resolves username, POST /auth/login → JWT.</td></tr>
            <tr className="border-b border-slate-100 last:border-0"><td className="px-4 py-2 font-medium text-slate-800">legacy</td><td className="px-4 py-2 text-slate-600">bam</td><td className="px-4 py-2 text-slate-600">BAM SSO token, backend validates and extracts user from BAM/AD.</td></tr>
          </tbody>
        </table>
        <h3 className="text-sm font-medium text-slate-700 mb-2">AD groups &amp; Spring</h3>
        <ul className="list-disc list-inside space-y-1 text-slate-700 mb-4">
          <li><strong>users table</strong> – Stores username, role, fullName, region. Lookup is case-insensitive. Usernames typically come from AD <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">samAccountName</code> or <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">userName</code>.</li>
          <li><strong>Role mapping</strong> – ADMIN adds users and assigns roles (ADMIN, REVIEWER, APPROVER, RTB_OWNER, TECH_LEAD, PROJECT_MANAGER, READ_ONLY). Users not in the table get READ_ONLY. Inactive users are denied.</li>
          <li><strong>Spring Security</strong> – BamAuthenticationFilter (local/ad/bam), JwtAuthFilter (Bearer token). SecurityConfig defines role-based rules. POST /auth/login is public; all other API paths require auth.</li>
        </ul>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Auth flow diagrams</h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Local (localhost / authMode: local)</h4>
            <MermaidDiagram id="local-flow" chart={`sequenceDiagram
    participant Browser
    participant UI as SPA
    participant BE as Spring Boot

    Browser->>UI: Load app
    UI->>BE: GET /users/me (X-Authenticated-User)
    BE->>BE: BamAuthenticationFilter reads header
    BE->>BE: Lookup users table
    BE-->>UI: { username, role, fullName, region }
    UI->>UI: Set user, show role switcher`} />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">AD auth (prod / dev / prod-h2, authMode: ad)</h4>
            <MermaidDiagram id="ad-flow" chart={`sequenceDiagram
    participant Browser
    participant AD as AD API
    participant UI as SPA
    participant BE as Spring Boot

    Browser->>AD: GET /api/getADUsers (Windows Auth, withCredentials)
    AD-->>UI: { userName, samAccountName, ... }
    UI->>UI: Resolve username
    UI->>BE: POST /auth/login { username }
    BE->>BE: Lookup users table
    alt User exists and active
        BE-->>UI: { token, username, role, ... }
        UI->>UI: Store JWT
        UI->>BE: API calls with Bearer token
    else User not found
        BE-->>UI: { token, role: READ_ONLY }
    end`} />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">BAM SSO (legacy, authMode: bam)</h4>
            <MermaidDiagram id="bam-flow" chart={`sequenceDiagram
    participant Browser
    participant BAM as BAM SSO
    participant UI as SPA
    participant BE as Spring Boot

    Browser->>BAM: Windows Auth
    BAM-->>UI: BAM token
    UI->>BE: GET /bam/token, then /users/me
    BE->>BE: BamAuthenticationFilter validates BAM token
    BE->>BE: Extract username, lookup users table
    BE-->>UI: User + role
    UI->>BE: API calls with Bearer token`} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Quick reference</h2>
        <p className="text-slate-600 text-sm mb-4">I want to… → Where to go → Who can do it</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2 font-semibold text-slate-700">I want to…</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Where</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Who</th>
              </tr>
            </thead>
            <tbody>
              {QUICK_REF.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-800">{row.want}</td>
                  <td className="px-4 py-2 text-slate-600">{row.where}</td>
                  <td className="px-4 py-2 text-slate-600">{row.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-center text-sm text-slate-500">
        Need more detail? See <strong>Role rules – Who can do what</strong> on the <Link to="/knowledge" className="text-primary hover:underline">Knowledge Base</Link> page, check <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">docs/USER_GUIDE.md</code>, or ask your FAST admin.
      </div>
    </div>
  );
}
