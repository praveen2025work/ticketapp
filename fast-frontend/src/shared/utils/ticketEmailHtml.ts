import type { FastProblem, ApprovalRecord, TicketLink, IncidentLink, TicketComment, TicketProperty } from '../types';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>\n');

const statusFlow = ['BACKLOG', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ROOT_CAUSE_IDENTIFIED', 'FIX_IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ARCHIVED'];
const statusLabels: Record<string, string> = {
  BACKLOG: 'Backlog',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  ROOT_CAUSE_IDENTIFIED: 'RCA Done',
  FIX_IN_PROGRESS: 'Fix In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
};

function formatRole(role?: string) {
  if (role === 'REVIEWER') return 'Finance';
  if (role === 'APPROVER') return 'Tech';
  if (role === 'RTB_OWNER') return 'RTB';
  return (role ?? 'Approval').replace(/_/g, ' ');
}

/**
 * Plain text summary for mailto: body (no HTML).
 */
export function getTicketEmailPlainText(ticket: FastProblem, ticketUrl?: string): string {
  const lines: string[] = [
    `FAST Ticket: ${ticket.pbtId} – ${ticket.title}`,
    '',
    '--- Problem Details ---',
    ticket.description || 'No description provided',
    '',
    'Affected application: ' + (ticket.affectedApplication || '—'),
    'Status: ' + (ticket.status?.replace(/_/g, ' ') ?? '—'),
    'Priority: ' + (ticket.priority != null ? `${ticket.priority}/5` : '—'),
    'Assigned to: ' + (ticket.assignedTo || 'Unassigned'),
    'Assignment group: ' + (ticket.assignmentGroup || '—'),
    'INC: ' + (ticket.servicenowIncidentNumber || '—'),
    'PRB: ' + (ticket.servicenowProblemNumber || '—'),
  ];
  if (ticket.anticipatedBenefits) {
    lines.push('', 'Anticipated benefits: ', ticket.anticipatedBenefits);
  }
  if (ticket.rootCause) {
    lines.push('', 'Root cause: ', ticket.rootCause);
  }
  if (ticket.workaround) {
    lines.push('', 'Workaround: ', ticket.workaround);
  }
  if (ticket.permanentFix) {
    lines.push('', 'Permanent fix: ', ticket.permanentFix);
  }
  if (ticketUrl) {
    lines.push('', 'View in FAST: ' + ticketUrl);
  }
  return lines.join('\n');
}

/**
 * Full HTML document matching the ticket detail page layout.
 * Uses inline styles for email client compatibility.
 */
export function getTicketEmailHtml(ticket: FastProblem, ticketUrl?: string): string {
  const title = esc(ticket.title ?? '');
  const pbtId = esc(ticket.pbtId ?? '');
  const description = nl2br(ticket.description || 'No description provided');
  const application = esc(ticket.affectedApplication || '—');
  const status = (ticket.status ?? '').replace(/_/g, ' ');
  const statusEsc = esc(status);
  const priority = ticket.priority != null && ticket.priority >= 1 && ticket.priority <= 5 ? `${ticket.priority}/5` : '—';
  const assignedTo = esc(ticket.assignedTo || 'Unassigned');
  const assignmentGroup = esc(ticket.assignmentGroup || '—');
  const inc = esc(ticket.servicenowIncidentNumber || '—');
  const prb = esc(ticket.servicenowProblemNumber || '—');
  const benefits = ticket.anticipatedBenefits ? nl2br(ticket.anticipatedBenefits) : '';
  const rootCause = ticket.rootCause ? nl2br(ticket.rootCause) : '';
  const workaround = ticket.workaround ? nl2br(ticket.workaround) : '';
  const permanentFix = ticket.permanentFix ? nl2br(ticket.permanentFix) : '';
  const createdBy = esc(ticket.createdBy ?? '—');
  const createdDate = ticket.createdDate ? new Date(ticket.createdDate).toLocaleDateString() : '—';
  const resolvedDate = ticket.resolvedDate ? new Date(ticket.resolvedDate).toLocaleDateString() : '';
  const userImpact = ticket.userImpactCount != null ? ticket.userImpactCount.toLocaleString() : '—';
  const age = ticket.ticketAgeDays != null ? `${ticket.ticketAgeDays} days` : '—';
  const targetSla = ticket.targetResolutionHours != null ? `${ticket.targetResolutionHours}h` : '—';
  const regions = ticket.regionalCodes?.length ? esc(ticket.regionalCodes.join(', ')) : '—';
  const classification = ticket.classification ?? 'A';
  const ragStatus = ticket.ragStatus ?? null;

  // RAG badge inline styles
  const ragStyle = ragStatus === 'G' ? 'background:#d1fae5; color:#047857;' : ragStatus === 'A' ? 'background:#fef3c7; color:#b45309;' : ragStatus === 'R' ? 'background:#fee2e2; color:#b91c1c;' : 'background:#f1f5f9; color:#64748b;';
  const ragLabel = ragStatus === 'G' ? 'G – Green (≤15d)' : ragStatus === 'A' ? 'A – Amber (15–20d)' : ragStatus === 'R' ? 'R – Red (>20d)' : '';

  // Classification badge
  const classStyle = classification === 'A' ? 'background:#dcfce7; color:#166534;' : classification === 'R' ? 'background:#fef9c3; color:#854d0e;' : 'background:#fee2e2; color:#b91c1c;';
  const classLabel = classification === 'A' ? 'A - Approve' : classification === 'R' ? 'R - Review' : 'P - Priority';

  // Workflow timeline
  const currentStatus = ticket.status ?? 'BACKLOG';
  const isRejected = currentStatus === 'REJECTED';
  const currentIndex = statusFlow.indexOf(currentStatus);
  const workflowSteps = isRejected
    ? '<span style="display:inline-block; padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:500; background:#fee2e2; color:#b91c1c;">Rejected</span>'
    : statusFlow
        .map((s, i) => {
          const isCompleted = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const bg = isCurrent ? '#0d9488' : isCompleted ? '#d1fae5' : '#f1f5f9';
          const color = isCurrent ? '#fff' : isCompleted ? '#047857' : '#94a3b8';
          const label = statusLabels[s] ?? s.replace(/_/g, ' ');
          return `<span style="display:inline-block; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:500; background:${bg}; color:${color}; white-space:nowrap;">${label}</span>`;
        })
        .join('<span style="display:inline-block; width:8px; height:2px; margin:0 2px; vertical-align:middle; background:#cbd5e1;"></span>');

  // Approval records
  const approvalRecords = (ticket.approvalRecords ?? []) as ApprovalRecord[];
  const approvalRows = approvalRecords
    .map((a) => {
      const role = formatRole(a.approvalRole);
      const reviewer = a.reviewerName ? ` — decided by ${esc(a.reviewerName)}` : '';
      const comments = a.comments ? `<p style="margin:4px 0 0; font-size:12px; color:#64748b;">${nl2br(a.comments)}</p>` : '';
      const decisionStyle =
        a.decision === 'APPROVED'
          ? 'background:#d1fae5; color:#047857;'
          : a.decision === 'REJECTED'
            ? 'background:#fee2e2; color:#b91c1c;'
            : 'background:#fef3c7; color:#b45309;';
      return `<tr><td style="padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;" colspan="2"><div><span style="font-weight:500; color:#0f172a;">${esc(role)}</span><span style="font-size:13px; color:#64748b;">${reviewer}</span>${comments}</div></td><td style="padding:12px; vertical-align:middle; text-align:right;"><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:500; ${decisionStyle}">${esc(a.decision)}</span></td></tr>`;
    })
    .join('');

  // Links
  const links = (ticket.links ?? []) as TicketLink[];
  const linkRows = links
    .map(
      (link) =>
        `<tr><td style="padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;" colspan="2">${(link.linkType === 'JIRA' || link.linkType === 'SERVICEFIRST') ? `<span style="padding:2px 6px; border-radius:4px; font-size:11px; font-weight:500; background:#e2e8f0; color:#475569;">${esc(link.linkType ?? '')}</span> ` : ''}<a href="${esc(link.url)}" style="color:#0d9488; font-weight:500;">${esc(link.label)}</a></td></tr>`
    )
    .join('');

  // Incident links
  const incidentLinks = (ticket.incidentLinks ?? []) as IncidentLink[];
  const incidentRows = incidentLinks
    .map(
      (link) =>
        `<tr><td style="padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;"><span style="font-family:monospace; font-weight:500; color:#0f172a;">${esc(link.incidentNumber)}</span><span style="margin-left:8px; color:#64748b;">${esc(link.description || '')}</span></td><td style="padding:12px; text-align:right;"><span style="padding:2px 6px; border-radius:4px; font-size:11px; background:#e2e8f0; color:#475569;">${esc(link.linkType || '')}</span></td></tr>`
    )
    .join('');

  // Comments
  const comments = (ticket.comments ?? []) as TicketComment[];
  const commentRows = comments
    .map(
      (c) =>
        `<tr><td style="padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; border-left:2px solid #94a3b8;"><div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b; margin-bottom:4px;"><span style="font-weight:500; color:#475569;">${esc(c.authorUsername)}</span><span>${new Date(c.createdDate).toLocaleString()}</span></div><p style="margin:0; color:#334155; white-space:pre-wrap;">${nl2br(c.commentText)}</p></td></tr>`
    )
    .join('');

  // Custom properties
  const properties = (ticket.properties ?? []) as TicketProperty[];
  const propertyRows = properties
    .map(
      (p) =>
        `<tr><td style="padding:8px 12px; background:#f8fafc; border-radius:6px; font-weight:500; color:#334155;">${esc(p.key)}</td><td style="padding:8px 12px; color:#475569;">${esc(p.value)}</td></tr>`
    )
    .join('');

  // Applications
  const applications = ticket.applications ?? [];
  const appTags =
    applications.length > 0
      ? applications
          .map((a) => `<span style="display:inline-block; padding:2px 8px; margin:2px 2px 2px 0; border-radius:6px; font-size:11px; background:#f1f5f9; color:#334155;">${esc(a.name)}${a.code ? ` (${esc(a.code)})` : ''}</span>`)
          .join('')
      : '';

  const viewInFast = ticketUrl
    ? `<p style="margin:20px 0 0; font-size:13px;"><a href="${esc(ticketUrl)}" style="color:#0d9488;">View in FAST →</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FAST Ticket ${pbtId}</title>
</head>
<body style="margin:0; padding:16px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; line-height:1.5; color:#1e293b; background:#f1f5f9;">
  <div style="max-width:900px; margin:0 auto;">
    <!-- Header: title -->
    <div style="margin-bottom:12px;">
      <h1 style="margin:0; font-size:20px; font-weight:600; color:#0f172a;">${title}</h1>
      <p style="margin:4px 0 0; font-size:13px; color:#64748b;">PBT ${pbtId}</p>
    </div>

    <!-- At a glance bar -->
    <div style="padding:12px 16px; border-radius:12px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:16px; font-size:13px;">
      <span style="font-weight:500; color:#64748b;">Status</span>
      <span style="margin-left:8px; padding:4px 10px; border-radius:8px; font-weight:500; background:rgba(13,148,136,0.15); color:#0d9488;">${statusEsc}</span>
      <span style="margin:0 8px; color:#cbd5e1;">·</span>
      <span style="color:#475569;">${ticket.ticketAgeDays ?? 0} days old</span>
      ${ragLabel ? `<span style="margin:0 8px; color:#cbd5e1;">·</span><span style="padding:2px 8px; border-radius:4px; font-size:11px; font-weight:500; ${ragStyle}">${ragLabel}</span>` : ''}
      <span style="margin:0 8px; color:#cbd5e1;">·</span>
      <span style="color:#475569;">Priority ${priority}</span>
      <span style="margin:0 8px; color:#cbd5e1;">·</span>
      <span style="color:#475569;">Assigned to <strong>${assignedTo}</strong></span>
      <span style="margin:0 8px; color:#cbd5e1;">·</span>
      <span style="font-family:monospace; font-size:12px; color:#64748b;">INC ${inc} · PRB ${prb}</span>
      <span style="margin-left:8px;"><span style="display:inline-block; padding:2px 10px; border-radius:9999px; font-size:11px; font-weight:500; ${classStyle}">${classLabel}</span></span>
    </div>

    <!-- Workflow -->
    <div style="margin-bottom:24px; padding:16px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 4px; font-size:13px; font-weight:600; color:#475569;">Workflow</h2>
      <p style="margin:0 0 12px; font-size:12px; color:#94a3b8;">Current stage in the ticket lifecycle</p>
      <div>${workflowSteps}</div>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="width:66%; vertical-align:top; padding-right:16px;">
          <!-- Problem Details -->
          <div style="margin-bottom:24px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
            <div style="border-bottom:1px solid #f1f5f9; padding:16px 24px;">
              <h2 style="margin:0; font-size:16px; font-weight:600; color:#0f172a;">Problem Details</h2>
            </div>
            <div style="padding:24px;">
              <div style="margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; background:#f1f5f9; color:#64748b;">📄</span>
                  <span style="font-size:12px; font-weight:500; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Description</span>
                </div>
                <p style="margin:0 0 0 40px; color:#334155; font-size:15px; line-height:1.6; white-space:pre-wrap;">${description}</p>
              </div>
              ${benefits ? `<div style="margin-left:40px; padding:12px 16px; border-left:2px solid #34d399; border-radius:0 8px 8px 0; background:rgba(16,185,129,0.08);"><div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;"><span style="font-size:11px; font-weight:600; color:#047857; text-transform:uppercase;">Expected outcome</span></div><p style="margin:0; font-size:13px; color:#065f46; line-height:1.5;">${benefits}</p></div>` : ''}
            </div>
          </div>

          <!-- Resolution Details -->
          ${ticket.rootCause || ticket.workaround || ticket.permanentFix ? `
          <div style="margin-bottom:24px; padding:24px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 4px; font-size:18px; font-weight:600; color:#0f172a;">Resolution Details</h2>
            <p style="margin:0 0 12px; font-size:12px; color:#64748b;">Root cause and workaround</p>
            ${ticket.rootCause ? `<div style="margin-bottom:12px;"><p style="margin:0 0 4px; font-size:12px; font-weight:500; color:#64748b;">Root Cause</p><p style="margin:0; color:#334155;">${rootCause}</p></div>` : ''}
            ${ticket.workaround ? `<div style="margin-bottom:12px;"><p style="margin:0 0 4px; font-size:12px; font-weight:500; color:#64748b;">Workaround</p><p style="margin:0; color:#334155;">${workaround}</p></div>` : ''}
            ${ticket.permanentFix ? `<div><p style="margin:0 0 4px; font-size:12px; font-weight:500; color:#64748b;">Permanent Fix</p><p style="margin:0; color:#334155;">${permanentFix}</p></div>` : ''}
          </div>
          ` : ''}

          <!-- Approval History -->
          ${approvalRecords.length > 0 ? `
          <div style="margin-bottom:24px; padding:24px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 4px; font-size:18px; font-weight:600; color:#0f172a;">Approval History <span style="font-size:13px; font-weight:400; color:#64748b;">(${approvalRecords.length})</span></h2>
            <p style="margin:0 0 12px; font-size:12px; color:#64748b;">Sign-offs and approvals</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;"><tbody>${approvalRows}</tbody></table>
          </div>
          ` : ''}

          <!-- Links -->
          <div style="margin-bottom:24px; padding:24px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 4px; font-size:18px; font-weight:600; color:#0f172a;">Links ${links.length > 0 ? `<span style="font-size:13px; font-weight:400; color:#64748b;">(${links.length})</span>` : ''}</h2>
            <p style="margin:0 0 12px; font-size:12px; color:#64748b;">JIRA, ServiceFirst, or other related URLs</p>
            ${links.length > 0 ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;"><tbody>${linkRows}</tbody></table>` : '<p style="margin:0; font-size:13px; color:#64748b;">No links.</p>'}
          </div>

          <!-- Linked Incidents -->
          ${incidentLinks.length > 0 ? `
          <div style="margin-bottom:24px; padding:24px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 12px; font-size:18px; font-weight:600; color:#0f172a;">Linked Incidents</h2>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;"><tbody>${incidentRows}</tbody></table>
          </div>
          ` : ''}

          <!-- Comments -->
          <div style="margin-bottom:24px; padding:24px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 4px; font-size:18px; font-weight:600; color:#0f172a;">Comments ${comments.length > 0 ? `<span style="font-size:13px; font-weight:400; color:#64748b;">(${comments.length})</span>` : ''}</h2>
            <p style="margin:0 0 12px; font-size:12px; color:#64748b;">Activity and updates on this ticket</p>
            ${comments.length > 0 ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;"><tbody>${commentRows}</tbody></table>` : '<p style="margin:0; font-size:13px; color:#64748b;">No comments yet.</p>'}
          </div>

          <!-- Custom properties -->
          <div style="margin-bottom:24px; padding:24px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 12px; font-size:18px; font-weight:600; color:#0f172a;">Custom properties</h2>
            ${properties.length > 0 ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;"><tbody>${propertyRows}</tbody></table>` : '<p style="margin:0; font-size:13px; color:#64748b;">No custom properties.</p>'}
          </div>
        </td>
        <td style="width:34%; vertical-align:top;">
          <!-- Sidebar: Identifiers -->
          <div style="margin-bottom:16px; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 12px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase;">Identifiers</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px;">
              <tr><td style="padding:4px 0; color:#64748b;">INC</td><td style="padding:4px 0; text-align:right; font-family:monospace; color:#0f172a;">${inc}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">PRB</td><td style="padding:4px 0; text-align:right; font-family:monospace; color:#0f172a;">${prb}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">PBT ID</td><td style="padding:4px 0; text-align:right; font-family:monospace; color:#0f172a;">${pbtId}</td></tr>
              ${ticket.requestNumber ? `<tr><td style="padding:4px 0; color:#64748b;">Request #</td><td style="padding:4px 0; text-align:right; font-family:monospace; color:#0f172a;">${esc(ticket.requestNumber)}</td></tr>` : ''}
            </table>
          </div>

          <!-- Impact & SLA -->
          <div style="margin-bottom:16px; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 12px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase;">Impact & SLA</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px;">
              <tr><td style="padding:4px 0; color:#64748b;">User impact</td><td style="padding:4px 0; text-align:right; font-weight:600; color:#0f172a;">${userImpact}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Priority</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${ticket.priority != null && ticket.priority >= 1 && ticket.priority <= 5 ? `${ticket.priority} / 5` : '—'}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Age</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${age}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Target SLA</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${targetSla}</td></tr>
            </table>
          </div>

          <!-- Classification & scope -->
          <div style="margin-bottom:16px; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 12px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase;">Classification & scope</h3>
            <div style="font-size:13px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><span style="color:#64748b;">Classification</span><span style="display:inline-block; padding:2px 10px; border-radius:9999px; font-size:11px; font-weight:500; ${classStyle}">${classLabel}</span></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="color:#64748b;">Regions</span><span style="color:#0f172a; text-align:right;">${regions}</span></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="color:#64748b;">Application</span><span style="color:#0f172a; word-break:break-word;">${application}</span></div>
              ${appTags ? `<div style="margin-top:8px;"><span style="color:#64748b; display:block; margin-bottom:4px;">Impacted apps</span><div>${appTags}</div></div>` : ''}
            </div>
          </div>

          <!-- People & dates -->
          <div style="margin-bottom:16px; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 12px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase;">People & dates</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px;">
              <tr><td style="padding:4px 0; color:#64748b;">Created by</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${createdBy}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Assigned to</td><td style="padding:4px 0; text-align:right; font-weight:500; color:#0f172a;">${assignedTo}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Group</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${assignmentGroup}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Created</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${createdDate}</td></tr>
              ${resolvedDate ? `<tr><td style="padding:4px 0; color:#64748b;">Resolved</td><td style="padding:4px 0; text-align:right; color:#0f172a;">${resolvedDate}</td></tr>` : ''}
            </table>
          </div>

          <!-- References -->
          <div style="margin-bottom:16px; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 12px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase;">References</h3>
            <div style="font-size:13px;">
              ${ticket.confluenceLink ? `<a href="${esc(ticket.confluenceLink)}" style="color:#0d9488;">Confluence →</a>` : '<span style="color:#94a3b8;">No Confluence link</span>'}
              ${links.length > 0 ? `<p style="margin:8px 0 0; color:#64748b;">${links.length} link(s) in main section</p>` : ''}
            </div>
          </div>

          <!-- Knowledge Article -->
          ${ticket.knowledgeArticle ? `
          <div style="margin-bottom:16px; padding:16px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 8px; font-size:14px; font-weight:600; color:#0f172a;">Knowledge Article</h3>
            <p style="margin:0 0 4px; font-size:13px; color:#0d9488; font-weight:500;">${esc(ticket.knowledgeArticle.title)}</p>
            <span style="display:inline-block; margin-top:4px; padding:2px 8px; border-radius:4px; font-size:11px; ${ticket.knowledgeArticle.status === 'PUBLISHED' ? 'background:#d1fae5; color:#047857;' : 'background:#fef3c7; color:#b45309;'}">${esc(ticket.knowledgeArticle.status)}</span>
          </div>
          ` : ''}
        </td>
      </tr>
    </table>

    ${viewInFast}
    <p style="margin:16px 0 0; font-size:11px; color:#94a3b8;">FAST Problem Ticket System</p>
  </div>
</body>
</html>`;
}

/**
 * Builds a mailto: URL for the ticket (subject + optional body).
 */
export function getTicketMailtoUrl(
  ticket: FastProblem,
  options: { to?: string; body?: string; ticketUrl?: string } = {}
): string {
  const subject = `FAST Ticket: ${ticket.pbtId} – ${ticket.title}`;
  const body = options.body ?? getTicketEmailPlainText(ticket, options.ticketUrl);
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  if (options.to) params.set('to', options.to);
  return `mailto:${options.to ? options.to : ''}?${params.toString()}`;
}
