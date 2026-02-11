// Enums
export type Classification = 'A' | 'R' | 'P';
export type RegionalCode = 'USDS' | 'UM' | 'JPL' | 'CHN';
export type StatusIndicator = 'R16' | 'B16';
export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ROOT_CAUSE_IDENTIFIED' | 'FIX_IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'ADMIN' | 'REVIEWER' | 'APPROVER' | 'RTB_OWNER' | 'TECH_LEAD' | 'READ_ONLY';

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
  anticipatedBenefits: string;
  classification: Classification;
  regionalCode: RegionalCode;
  ticketAgeDays: number;
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
  confluenceLink?: string;
  createdDate: string;
  updatedDate: string;
  resolvedDate: string | null;
  approvalRecords?: ApprovalRecord[];
  incidentLinks?: IncidentLink[];
  knowledgeArticle?: KnowledgeArticle | null;
}

export interface ApprovalRecord {
  id: number;
  fastProblemId: number;
  reviewerName: string;
  reviewerEmail: string;
  decision: ApprovalDecision;
  comments: string;
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
  averageResolutionTimeHours: number | null;
  slaCompliancePercentage: number | null;
  ticketsByClassification: Record<string, number>;
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
  anticipatedBenefits?: string;
  regionalCode: RegionalCode;
  targetResolutionHours?: number;
  priority?: number;
  assignedTo?: string;
  assignmentGroup?: string;
  confluenceLink?: string;
}

export interface UpdateFastProblemRequest {
  servicenowIncidentNumber?: string;
  servicenowProblemNumber?: string;
  title?: string;
  description?: string;
  userImpactCount?: number;
  affectedApplication?: string;
  anticipatedBenefits?: string;
  regionalCode?: RegionalCode;
  targetResolutionHours?: number;
  priority?: number;
  assignedTo?: string;
  assignmentGroup?: string;
  rootCause?: string;
  workaround?: string;
  permanentFix?: string;
  confluenceLink?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  region?: string;
}
