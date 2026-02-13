import { Link } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';

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
  { want: 'See overview of tickets and metrics', where: 'Dashboard', who: 'All' },
  { want: 'See all tickets, search and filter (default: 10 biz days)', where: 'Tickets', who: 'All' },
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
          FAST is a problem ticket system. You can record problems, track them through statuses (New → In progress → Resolved → Closed),
          get approvals from reviewers, and reuse solutions from the Knowledge Base. Your menu and actions depend on your role.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Navigation</h2>
        <ul className="space-y-2 text-slate-700">
          <li><Link to="/dashboard" className="text-primary hover:underline font-medium">Dashboard</Link> – metrics, charts, quick ticket list</li>
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
          Admin creates a ticket (NEW) → Submits for approval → Reviewer, Approver, and RTB Owner approve (each role must approve) → All three must approve → ASSIGNED →
          RTB Owner assigns to Admin or Tech Lead → Tech Lead/Admin works on fix (IN_PROGRESS → ROOT_CAUSE → FIX_IN_PROGRESS → RESOLVED) →
          Admin closes (CLOSED). When a ticket is Resolved, a Knowledge Base article is auto-created. If any Reviewer, Approver, or RTB Owner rejects, the ticket moves to REJECTED. Admin can also Close or Reject a ticket from NEW or ASSIGNED.
        </p>
        <p className="text-slate-600 text-sm mb-3">
          <strong>Approval restriction:</strong> Only users linked to the ticket&apos;s Impacted applications (Admin → Users → Applications) can approve or reject that ticket. Admin can approve any ticket.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <span className="px-2 py-1 bg-slate-100 rounded">NEW</span>
          <span>→</span>
          <span className="px-2 py-1 bg-slate-100 rounded">ASSIGNED</span>
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
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Dashboard & Tickets</h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 mb-4">
          <li><strong>Dashboard filters:</strong> Filter by Application (matches Impacted applications on tickets), Region (APAC, EMEA, AMER), and period (Overall, Weekly, Monthly).</li>
          <li><strong>Tickets screen:</strong> Default date range is the last 10 business days. Clear filters resets to that range.</li>
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
        </ul>
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
