// Enums
export type Classification = 'A' | 'R' | 'P';
/** RAG escalation: G = ≤15 days, A = 15–20 days, R = >20 days */
export type RagStatus = 'G' | 'A' | 'R';
export type RegionalCode = 'APAC' | 'EMEA' | 'AMER';
export type StatusIndicator = 'R16' | 'B16';
export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ROOT_CAUSE_IDENTIFIED' | 'FIX_IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED' | 'ARCHIVED';
export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'ADMIN' | 'REVIEWER' | 'APPROVER' | 'RTB_OWNER' | 'TECH_LEAD' | 'PROJECT_MANAGER' | 'READ_ONLY';

export interface ApplicationRef {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  createdDate?: string;
  updatedDate?: string | null;
}

// Response Types
export interface FastProblem {
  id: number;
  servicenowIncidentNumber: string;
  servicenowProblemNumber: string;
  pbtId: string;
  title: string;
  description: string;
  userImpactCount: number;
  affectedApplication: string;
  requestNumber?: string;
  applications?: ApplicationRef[];
  anticipatedBenefits: string;
  classification: Classification;
  regionalCodes: RegionalCode[];
  ticketAgeDays: number;
  ragStatus?: RagStatus | null;
  statusIndicator: StatusIndicator;
  status: TicketStatus;
  priorityScore?: number;
  priority?: number;
  targetResolutionHours: number;
  apiIntegrationStatus: string;
  rootCause: string;
  workaround: string;
  permanentFix: string;
  createdBy: string;
  assignedTo: string;
  assignmentGroup: string;
  /** BTB Tech Lead (reference) — assignable once all approvals are done. */
  btbTechLeadUsername?: string | null;
  confluenceLink?: string;
  createdDate: string;
  updatedDate: string;
  resolvedDate: string | null;
  approvalRecords?: ApprovalRecord[];
  incidentLinks?: IncidentLink[];
  links?: TicketLink[];
  properties?: TicketProperty[];
  comments?: TicketComment[];
  knowledgeArticle?: KnowledgeArticle | null;
}

export interface TicketComment {
  id: number;
  authorUsername: string;
  commentText: string;
  createdDate: string;
}

export interface TicketLink {
  id: number;
  label: string;
  url: string;
  linkType?: string | null;
}

export interface TicketProperty {
  key: string;
  value: string;
}

export interface ApprovalRecord {
  id: number;
  fastProblemId: number;
  /** Ticket title for display in approval queue. */
  fastProblemTitle?: string;
  /** Which slot: REVIEWER, APPROVER, or RTB_OWNER. Anyone with that role can approve. */
  approvalRole?: string;
  /** Who performed the decision (set when someone approves/rejects); empty while PENDING. */
  reviewerName?: string;
  reviewerEmail?: string;
  decision: ApprovalDecision;
  comments?: string;
  decisionDate: string | null;
  createdDate: string;
}

export interface KnowledgeArticle {
  id: number;
  fastProblemId: number;
  title: string;
  rootCause: string;
  workaround: string;
  permanentFix: string;
  category: string;
  status: string;
  createdDate: string;
  publishedDate: string | null;
}

export interface IncidentLink {
  id: number;
  fastProblemId: number;
  incidentNumber: string;
  linkType: string;
  description: string;
  linkedDate: string;
}

export interface DashboardMetrics {
  totalOpenTickets: number;
  totalResolvedTickets: number;
  totalClosedTickets: number;
  totalArchivedTickets?: number;
  averageResolutionTimeHours: number | null;
  slaCompliancePercentage: number | null;
  ticketsByClassification: Record<string, number>;
  ticketsByRag?: Record<string, number>;
  ticketsByRegion: Record<string, number>;
  ticketsByStatus: Record<string, number>;
  avgResolutionByRegion: Record<string, number>;
  agingDistribution: Record<string, number>;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AuthUser {
  username: string;
  fullName: string;
  role: string;
  region?: string;
  /** From AD */
  displayName?: string;
  emailAddress?: string;
  employeeId?: string;
  profilePhotoUrl?: string;
}

/** AD user from GET /bam/ad-user (Windows Auth) */
export interface AdUser {
  samAccountName?: string;
  userName?: string;
  displayName?: string;
  emailAddress?: string;
  employeeId?: string;
  givenName?: string;
  surname?: string;
  profilePhotoUrl?: string;
}

/** BAM token response from GET /bam/token */
export interface BamAuthResponse {
  code: string;
  message?: string;
  bamToken: string;
  redirectURL: string;
}

// Request Types
export interface CreateFastProblemRequest {
  servicenowIncidentNumber?: string;
  servicenowProblemNumber?: string;
  pbtId?: string;
  title: string;
  description?: string;
  userImpactCount?: number;
  affectedApplication?: string;
  requestNumber?: string;
  applicationIds?: number[];
  anticipatedBenefits?: string;
  regionalCodes: RegionalCode[];
  targetResolutionHours?: number;
  priority?: number;
  assignedTo?: string;
  assignmentGroup?: string;
  btbTechLeadUsername?: string | null;
  confluenceLink?: string;
}

export interface UpdateFastProblemRequest {
  servicenowIncidentNumber?: string;
  servicenowProblemNumber?: string;
  title?: string;
  description?: string;
  userImpactCount?: number;
  affectedApplication?: string;
  requestNumber?: string;
  applicationIds?: number[];
  anticipatedBenefits?: string;
  regionalCodes?: RegionalCode[];
  targetResolutionHours?: number;
  priority?: number;
  assignedTo?: string;
  assignmentGroup?: string;
  btbTechLeadUsername?: string | null;
  rootCause?: string;
  workaround?: string;
  permanentFix?: string;
  confluenceLink?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  region?: string;
}

/** Standard error body from backend (401, 403, 404, 500, validation). Use for issue identification. */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  code?: string;
  path?: string;
  details?: Record<string, string>;
}
