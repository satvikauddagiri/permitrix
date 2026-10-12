export type Role = 'student' | 'proctor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  password?: string; // stripped when sent to frontend
  department: string;
  phone?: string;
  avatarUrl?: string;
  studentDetails?: {
    rollNo: string;
    registerNo: string;
    proctorId: string;
    proctorName?: string;
    batch: string;
    section: string;
  };
  proctorDetails?: {
    designation: string;
    cabin: string;
    assignedCount?: number;
  };
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  rollNo: string;
  classesConducted: number | null;
  classesAttended: number | null;
  percentage: number | null;
  lastUpdated: string | null;
  semester: string;
  academicYear: string;
  // Computed flags based on settings:
  isEligible?: boolean;
  statusLabel?: 'Eligible' | 'Shortage' | 'Missing Data' | 'Outdated Data';
  statusColor?: 'emerald' | 'amber' | 'rose' | 'slate';
  daysOld?: number;
  flagReason?: string;
}

export type EventCategory =
  | 'Hackathon'
  | 'Conference'
  | 'Workshop'
  | 'Paper Presentation'
  | 'Coding Contest'
  | 'Technical Symposium'
  | 'Project Expo';

export type RequestStatus =
  | 'SUBMITTED'
  | 'RESUBMITTED'
  | 'PROCTOR_RECOMMENDED'
  | 'PROCTOR_RECOMMENDED_REJECT'
  | 'PROCTOR_RETURNED'
  | 'ADMIN_APPROVED'
  | 'ADMIN_OVERRIDE_APPROVED'
  | 'ADMIN_REJECTED'
  | 'ADMIN_RETURNED';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: string;
  remarks?: string;
}

export interface EventRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  department: string;
  proctorId: string;
  proctorName: string;
  eventTitle: string;
  category: EventCategory;
  organizer: string;
  location: string;
  mode: 'In-Person' | 'Virtual' | 'Hybrid';
  startDate: string;
  endDate: string;
  odDays: number;
  justification: string;
  supportingDocName: string;
  supportingDocUrl?: string;
  status: RequestStatus;
  attendanceSnapshot: {
    conducted: number | null;
    attended: number | null;
    percentage: number | null;
    lastUpdated: string | null;
    isEligible: boolean;
    flagReason?: string;
  };
  proctorReview?: {
    reviewedAt: string;
    recommendation: 'RECOMMEND_APPROVE' | 'RECOMMEND_REJECT' | 'RETURN_CORRECTION';
    remarks: string;
    proctorName: string;
  };
  adminDecision?: {
    decidedAt: string;
    decision: 'APPROVE' | 'REJECT' | 'RETURN_CORRECTION';
    remarks: string;
    rejectionReason?: string;
    overrideReason?: string;
    adminName: string;
  };
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  attendanceThreshold: number; // default: 75
  freshnessLimitDays: number; // default: 30
  universityName: string;
  portalName: string;
  academicYear: string;
  semester: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  requestId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  entityType: 'REQUEST' | 'ATTENDANCE_IMPORT' | 'STUDENT_REASSIGN' | 'SETTINGS' | 'AUTH';
  entityId?: string;
  details: string;
}

export interface AttendanceImportPreviewRow {
  rollNo: string;
  name?: string;
  email?: string;
  classesConducted: number;
  classesAttended: number;
  percentage: number;
  attendanceDate: string;
  isValid: boolean;
  validationError?: string;
  studentFound: boolean;
}
