import express, { Request, Response } from 'express';
import { dbManager } from '../db.ts';
import type {
  EventRequest,
  RequestStatus,
  AuditLogItem,
  NotificationItem,
  AttendanceImportPreviewRow,
} from '../../src/types/index.ts';

export const apiRouter = express.Router();

function getTimestamp(): string {
  return new Date().toISOString();
}

function sanitizeUser(u: any) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

// ==========================================
// 1. AUTHENTICATION & SESSIONS
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, expectedRole } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = dbManager.getDb();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid university credentials. No account found for this email address.' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please verify your credentials or contact administrator.' });
  }

  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({
      error: `Access Denied: This account has role "${user.role.toUpperCase()}", but you are logging in via the ${expectedRole.toUpperCase()} portal. Please use the /${user.role}/login portal.`,
      actualRole: user.role,
    });
  }

  // Create audit log for login
  const audit: AuditLogItem = {
    id: `audit-${Date.now()}`,
    timestamp: getTimestamp(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'AUTH',
    details: `User logged in successfully via ${user.role} portal.`,
  };
  db.auditLogs.unshift(audit);
  dbManager.saveDb(db);

  return res.json({
    token: `token-${user.id}-${Date.now()}`,
    user: sanitizeUser(user),
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Missing x-user-id header.' });
  }

  const db = dbManager.getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ user: sanitizeUser(user) });
});

apiRouter.get('/auth/demo-accounts', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  const admin = db.users.find(u => u.role === 'admin');
  const proctors = db.users.filter(u => u.role === 'proctor');
  const sampleStudents = db.users.filter(u => u.role === 'student').slice(0, 6);

  return res.json({
    admin: admin ? { email: admin.email, password: admin.password, name: admin.name } : null,
    proctors: proctors.map(p => ({ email: p.email, password: p.password, name: p.name, dept: p.department })),
    sampleStudents: sampleStudents.map(s => ({
      email: s.email,
      password: s.password,
      name: s.name,
      roll: s.studentDetails?.rollNo,
      proctorId: s.studentDetails?.proctorId,
    })),
  });
});

// ==========================================
// 2. STUDENT ENDPOINTS
// ==========================================

apiRouter.get('/student/dashboard', (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  if (!studentId) {
    return res.status(400).json({ error: 'studentId query param is required.' });
  }

  const db = dbManager.getDb();
  const student = db.users.find(u => u.id === studentId && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const rollNo = student.studentDetails?.rollNo;
  const attendance = db.attendance.find(a => a.studentId === studentId || a.rollNo === rollNo);
  const eligibility = dbManager.evaluateAttendanceEligibility(attendance, db.settings);

  const requests = db.requests
    .filter(r => r.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const notifications = db.notifications
    .filter(n => n.userId === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const proctor = db.users.find(u => u.id === student.studentDetails?.proctorId);

  return res.json({
    student: sanitizeUser({
      ...student,
      studentDetails: {
        ...student.studentDetails,
        proctorName: proctor?.name || 'Assigned Proctor',
      },
    }),
    attendance: attendance
      ? {
          ...attendance,
          ...eligibility,
        }
      : {
          classesConducted: null,
          classesAttended: null,
          percentage: null,
          lastUpdated: null,
          ...eligibility,
        },
    settings: db.settings,
    requests,
    notifications,
  });
});

apiRouter.post('/student/requests', (req: Request, res: Response) => {
  const {
    studentId,
    eventTitle,
    category,
    organizer,
    location,
    mode,
    startDate,
    endDate,
    odDays,
    justification,
    supportingDocName,
    supportingDocUrl,
  } = req.body;

  if (!studentId || !eventTitle || !startDate || !endDate || !odDays) {
    return res.status(400).json({ error: 'Missing required request fields.' });
  }

  const db = dbManager.getDb();
  const student = db.users.find(u => u.id === studentId && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const rollNo = student.studentDetails?.rollNo || '';
  const proctorId = student.studentDetails?.proctorId || '';
  const proctor = db.users.find(u => u.id === proctorId);

  // Snapshot attendance & eligibility
  const attRecord = db.attendance.find(a => a.studentId === studentId || a.rollNo === rollNo);
  const eligibility = dbManager.evaluateAttendanceEligibility(attRecord, db.settings);

  const requestId = `REQ-2026-${String(db.requests.length + 1).padStart(3, '0')}`;
  const now = getTimestamp();

  const newRequest: EventRequest = {
    id: requestId,
    studentId,
    studentName: student.name,
    rollNo,
    department: student.department,
    proctorId,
    proctorName: proctor?.name || 'Assigned Proctor',
    eventTitle,
    category: category || 'Hackathon',
    organizer: organizer || 'External Technical Organization',
    location: location || 'TBD',
    mode: mode || 'In-Person',
    startDate,
    endDate,
    odDays: Number(odDays),
    justification: justification || '',
    supportingDocName: supportingDocName || 'Supporting_Document.pdf',
    supportingDocUrl,
    status: 'SUBMITTED',
    attendanceSnapshot: {
      conducted: attRecord?.classesConducted ?? null,
      attended: attRecord?.classesAttended ?? null,
      percentage: attRecord?.percentage ?? null,
      lastUpdated: attRecord?.lastUpdated ?? null,
      isEligible: eligibility.isEligible,
      flagReason: eligibility.flagReason,
    },
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actorName: student.name,
        actorRole: 'student',
        action: 'Submitted Event Request',
        remarks: justification ? `Student Objective: ${justification.slice(0, 100)}...` : undefined,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.requests.unshift(newRequest);

  // Notify assigned proctor
  if (proctorId) {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: proctorId,
      title: 'New Technical Event Request',
      message: `${student.name} (${rollNo}) submitted request for "${eventTitle}". Review required.`,
      type: 'info',
      requestId,
      read: false,
      createdAt: now,
    };
    db.notifications.unshift(notif);
  }

  // Audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: student.id,
    userName: student.name,
    userRole: 'student',
    action: 'REQUEST_SUBMISSION',
    entityType: 'REQUEST',
    entityId: requestId,
    details: `Submitted new event request for "${eventTitle}" (${odDays} OD days). Attendance: ${attRecord?.percentage ?? 'N/A'}%`,
  });

  dbManager.saveDb(db);
  return res.status(201).json({ request: newRequest });
});

apiRouter.put('/student/requests/:id', (req: Request, res: Response) => {
  const requestId = req.params.id;
  const {
    studentId,
    eventTitle,
    category,
    organizer,
    location,
    mode,
    startDate,
    endDate,
    odDays,
    justification,
    supportingDocName,
    resubmissionRemarks,
  } = req.body;

  const db = dbManager.getDb();
  const requestIndex = db.requests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  const existing = db.requests[requestIndex];
  if (existing.studentId !== studentId) {
    return res.status(403).json({ error: 'Unauthorized. You can only edit your own requests.' });
  }

  if (existing.status !== 'PROCTOR_RETURNED' && existing.status !== 'ADMIN_RETURNED') {
    return res.status(400).json({ error: `Cannot edit request in status "${existing.status}". Only returned requests can be edited.` });
  }

  const now = getTimestamp();
  const updatedRequest: EventRequest = {
    ...existing,
    eventTitle: eventTitle || existing.eventTitle,
    category: category || existing.category,
    organizer: organizer || existing.organizer,
    location: location || existing.location,
    mode: mode || existing.mode,
    startDate: startDate || existing.startDate,
    endDate: endDate || existing.endDate,
    odDays: odDays !== undefined ? Number(odDays) : existing.odDays,
    justification: justification || existing.justification,
    supportingDocName: supportingDocName || existing.supportingDocName,
    status: 'RESUBMITTED',
    updatedAt: now,
    timeline: [
      ...existing.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actorName: existing.studentName,
        actorRole: 'student',
        action: 'Resubmitted Request for Correction',
        remarks: resubmissionRemarks || 'Updated requested documents and rectified details.',
      },
    ],
  };

  db.requests[requestIndex] = updatedRequest;

  // Notify proctor
  if (existing.proctorId) {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: existing.proctorId,
      title: 'Request Resubmitted',
      message: `${existing.studentName} resubmitted request "${updatedRequest.eventTitle}" with corrections.`,
      type: 'info',
      requestId: updatedRequest.id,
      read: false,
      createdAt: now,
    });
  }

  // Audit
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: studentId,
    userName: existing.studentName,
    userRole: 'student',
    action: 'REQUEST_RESUBMISSION',
    entityType: 'REQUEST',
    entityId: updatedRequest.id,
    details: `Resubmitted request ${updatedRequest.id} after addressing review remarks.`,
  });

  dbManager.saveDb(db);
  return res.json({ request: updatedRequest });
});

// ==========================================
// 3. PROCTOR ENDPOINTS
// ==========================================

apiRouter.get('/proctor/dashboard', (req: Request, res: Response) => {
  const proctorId = req.query.proctorId as string;
  if (!proctorId) {
    return res.status(400).json({ error: 'proctorId query parameter is required.' });
  }

  const db = dbManager.getDb();
  const proctor = db.users.find(u => u.id === proctorId && u.role === 'proctor');
  if (!proctor) {
    return res.status(404).json({ error: 'Proctor not found.' });
  }

  // Find all assigned students
  const assignedStudents = db.users
    .filter(u => u.role === 'student' && u.studentDetails?.proctorId === proctorId)
    .map(s => {
      const roll = s.studentDetails?.rollNo;
      const att = db.attendance.find(a => a.studentId === s.id || a.rollNo === roll);
      const evalResult = dbManager.evaluateAttendanceEligibility(att, db.settings);
      const studentRequests = db.requests.filter(r => r.studentId === s.id);
      return {
        ...sanitizeUser(s),
        attendance: att
          ? { ...att, ...evalResult }
          : { classesConducted: null, classesAttended: null, percentage: null, lastUpdated: null, ...evalResult },
        requestsCount: studentRequests.length,
        pendingRequestsCount: studentRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'RESUBMITTED').length,
      };
    });

  // Requests from assigned students
  const studentIds = new Set(assignedStudents.map(s => s.id));
  const requests = db.requests
    .filter(r => studentIds.has(r.studentId) || r.proctorId === proctorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const notifications = db.notifications
    .filter(n => n.userId === proctorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    proctor: sanitizeUser(proctor),
    assignedStudents,
    requests,
    settings: db.settings,
    notifications,
    counts: {
      totalAssigned: assignedStudents.length,
      pendingProctorReview: requests.filter(r => r.status === 'SUBMITTED' || r.status === 'RESUBMITTED').length,
      recommended: requests.filter(r => r.status === 'PROCTOR_RECOMMENDED' || r.status === 'PROCTOR_RECOMMENDED_REJECT').length,
      returned: requests.filter(r => r.status === 'PROCTOR_RETURNED').length,
    },
  });
});

apiRouter.post('/proctor/requests/:id/review', (req: Request, res: Response) => {
  const requestId = req.params.id;
  const { proctorId, recommendation, remarks } = req.body;

  if (!proctorId || !recommendation || !remarks) {
    return res.status(400).json({ error: 'proctorId, recommendation, and remarks are mandatory.' });
  }

  if (remarks.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide constructive remarks explaining your recommendation (minimum 5 characters).' });
  }

  const db = dbManager.getDb();
  const proctor = db.users.find(u => u.id === proctorId && u.role === 'proctor');
  if (!proctor) {
    return res.status(404).json({ error: 'Proctor not found.' });
  }

  const reqIndex = db.requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Event request not found.' });
  }

  const reqObj = db.requests[reqIndex];
  if (reqObj.proctorId !== proctorId) {
    return res.status(403).json({ error: 'Unauthorized. You can only review requests from your assigned students.' });
  }

  if (reqObj.status !== 'SUBMITTED' && reqObj.status !== 'RESUBMITTED') {
    return res.status(400).json({ error: `Cannot review request in current status "${reqObj.status}".` });
  }

  const now = getTimestamp();
  let newStatus: RequestStatus;
  let actionLabel: string;

  if (recommendation === 'RECOMMEND_APPROVE') {
    newStatus = 'PROCTOR_RECOMMENDED';
    actionLabel = 'Recommended Approval to Admin';
  } else if (recommendation === 'RECOMMEND_REJECT') {
    newStatus = 'PROCTOR_RECOMMENDED_REJECT';
    actionLabel = 'Recommended Rejection to Admin';
  } else if (recommendation === 'RETURN_CORRECTION') {
    newStatus = 'PROCTOR_RETURNED';
    actionLabel = 'Returned to Student for Correction';
  } else {
    return res.status(400).json({ error: 'Invalid recommendation type.' });
  }

  const updatedRequest: EventRequest = {
    ...reqObj,
    status: newStatus,
    updatedAt: now,
    proctorReview: {
      reviewedAt: now,
      recommendation,
      remarks,
      proctorName: proctor.name,
    },
    timeline: [
      ...reqObj.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actorName: proctor.name,
        actorRole: 'proctor',
        action: actionLabel,
        remarks,
      },
    ],
  };

  db.requests[reqIndex] = updatedRequest;

  // If returned, notify student. If recommended, notify admin.
  if (newStatus === 'PROCTOR_RETURNED') {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: reqObj.studentId,
      title: 'Request Returned for Correction',
      message: `Your proctor ${proctor.name} returned "${reqObj.eventTitle}" with remarks: "${remarks}"`,
      type: 'warning',
      requestId: reqObj.id,
      read: false,
      createdAt: now,
    });
  } else {
    // Notify admin
    const admin = db.users.find(u => u.role === 'admin');
    if (admin) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: admin.id,
        title: 'Proctor Recommendation Submitted',
        message: `${proctor.name} submitted recommendation for ${reqObj.studentName}'s request "${reqObj.eventTitle}". Final decision required.`,
        type: 'info',
        requestId: reqObj.id,
        read: false,
        createdAt: now,
      });
    }
  }

  // Audit
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: proctor.id,
    userName: proctor.name,
    userRole: 'proctor',
    action: `PROCTOR_${recommendation}`,
    entityType: 'REQUEST',
    entityId: reqObj.id,
    details: `Proctor ${proctor.name} reviewed request ${reqObj.id} (${recommendation}). Remarks: ${remarks}`,
  });

  dbManager.saveDb(db);
  return res.json({ request: updatedRequest });
});

// ==========================================
// 4. ADMINISTRATOR ENDPOINTS
// ==========================================

apiRouter.get('/admin/dashboard', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  const students = db.users.filter(u => u.role === 'student');
  const proctors = db.users.filter(u => u.role === 'proctor');

  // Compute attendance stats
  let eligibleCount = 0;
  let shortageCount = 0;
  let missingCount = 0;
  let outdatedCount = 0;
  let totalPctSum = 0;
  let validPctCount = 0;

  students.forEach(s => {
    const att = db.attendance.find(a => a.studentId === s.id || a.rollNo === s.studentDetails?.rollNo);
    const evalResult = dbManager.evaluateAttendanceEligibility(att, db.settings);
    if (evalResult.statusLabel === 'Eligible') eligibleCount++;
    else if (evalResult.statusLabel === 'Shortage') shortageCount++;
    else if (evalResult.statusLabel === 'Missing Data') missingCount++;
    else if (evalResult.statusLabel === 'Outdated Data') outdatedCount++;

    if (att && att.percentage !== null) {
      totalPctSum += att.percentage;
      validPctCount++;
    }
  });

  const avgAttendance = validPctCount > 0 ? Number((totalPctSum / validPctCount).toFixed(1)) : 0;

  // Requests breakdown
  const reqs = db.requests;
  const pendingProctor = reqs.filter(r => r.status === 'SUBMITTED' || r.status === 'RESUBMITTED').length;
  const pendingAdmin = reqs.filter(r => r.status === 'PROCTOR_RECOMMENDED' || r.status === 'PROCTOR_RECOMMENDED_REJECT').length;
  const approved = reqs.filter(r => r.status === 'ADMIN_APPROVED' || r.status === 'ADMIN_OVERRIDE_APPROVED').length;
  const rejected = reqs.filter(r => r.status === 'ADMIN_REJECTED').length;
  const returned = reqs.filter(r => r.status === 'PROCTOR_RETURNED' || r.status === 'ADMIN_RETURNED').length;

  // Proctor workload
  const proctorWorkloads = proctors.map(p => {
    const assigned = students.filter(s => s.studentDetails?.proctorId === p.id).length;
    const pReqs = reqs.filter(r => r.proctorId === p.id);
    return {
      id: p.id,
      name: p.name,
      department: p.department,
      assignedStudentsCount: assigned,
      pendingReviewsCount: pReqs.filter(r => r.status === 'SUBMITTED' || r.status === 'RESUBMITTED').length,
    };
  });

  return res.json({
    stats: {
      totalStudents: students.length,
      totalProctors: proctors.length,
      totalRequests: reqs.length,
      avgAttendance,
      eligibleCount,
      shortageCount,
      missingCount,
      outdatedCount,
      pendingProctor,
      pendingAdmin,
      approved,
      rejected,
      returned,
    },
    settings: db.settings,
    proctorWorkloads,
    recentRequests: reqs.slice(0, 8),
    recentAuditLogs: db.auditLogs.slice(0, 6),
  });
});

apiRouter.get('/admin/students', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  const proctorsMap = new Map(db.users.filter(u => u.role === 'proctor').map(p => [p.id, p]));

  const studentList = db.users
    .filter(u => u.role === 'student')
    .map(s => {
      const roll = s.studentDetails?.rollNo;
      const att = db.attendance.find(a => a.studentId === s.id || a.rollNo === roll);
      const evalResult = dbManager.evaluateAttendanceEligibility(att, db.settings);
      const proctor = s.studentDetails?.proctorId ? proctorsMap.get(s.studentDetails.proctorId) : null;
      const reqCount = db.requests.filter(r => r.studentId === s.id).length;

      return {
        ...sanitizeUser(s),
        proctorName: proctor?.name || 'Unassigned',
        proctorId: s.studentDetails?.proctorId || '',
        attendance: att
          ? { ...att, ...evalResult }
          : { classesConducted: null, classesAttended: null, percentage: null, lastUpdated: null, ...evalResult },
        requestsCount: reqCount,
      };
    });

  return res.json({
    students: studentList,
    proctors: db.users.filter(u => u.role === 'proctor').map(p => sanitizeUser(p)),
  });
});

apiRouter.post('/admin/students/reassign', (req: Request, res: Response) => {
  const { studentIds, newProctorId, adminId } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || !newProctorId) {
    return res.status(400).json({ error: 'studentIds array and newProctorId are required.' });
  }

  const db = dbManager.getDb();
  const newProctor = db.users.find(u => u.id === newProctorId && u.role === 'proctor');
  if (!newProctor) {
    return res.status(404).json({ error: 'Selected proctor does not exist.' });
  }

  let count = 0;
  studentIds.forEach(id => {
    const student = db.users.find(u => u.id === id && u.role === 'student');
    if (student && student.studentDetails) {
      student.studentDetails.proctorId = newProctorId;
      count++;
    }
  });

  // Also update open requests with the new proctor
  db.requests.forEach(r => {
    if (studentIds.includes(r.studentId) && (r.status === 'SUBMITTED' || r.status === 'RESUBMITTED')) {
      r.proctorId = newProctorId;
      r.proctorName = newProctor.name;
    }
  });

  const now = getTimestamp();
  const adminUser = db.users.find(u => u.id === adminId) || { name: 'Administrator' };

  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: adminId || 'admin',
    userName: adminUser.name,
    userRole: 'admin',
    action: 'STUDENT_REASSIGNMENT',
    entityType: 'STUDENT_REASSIGN',
    details: `Reassigned ${count} student(s) to ${newProctor.name} (${newProctor.department}).`,
  });

  dbManager.saveDb(db);
  return res.json({ success: true, reassignedCount: count, proctorName: newProctor.name });
});

apiRouter.get('/admin/requests', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  return res.json({ requests: db.requests });
});

apiRouter.post('/admin/requests/:id/decision', (req: Request, res: Response) => {
  const requestId = req.params.id;
  const { adminId, decision, remarks, rejectionReason, overrideReason } = req.body;

  if (!decision) {
    return res.status(400).json({ error: 'Decision (APPROVE, REJECT, or RETURN_CORRECTION) is required.' });
  }

  const db = dbManager.getDb();
  const admin = db.users.find(u => (u.id === adminId || u.role === 'admin') && u.role === 'admin');
  const adminName = admin?.name || 'Academic Dean';

  const reqIndex = db.requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Event request not found.' });
  }

  const reqObj = db.requests[reqIndex];
  const now = getTimestamp();

  // Evaluate current attendance eligibility
  const attRecord = db.attendance.find(a => a.studentId === reqObj.studentId || a.rollNo === reqObj.rollNo);
  const eligibility = dbManager.evaluateAttendanceEligibility(attRecord, db.settings);

  let newStatus: RequestStatus;
  let actionLabel: string;

  if (decision === 'APPROVE') {
    // If not eligible (shortage, missing, or outdated), require authorized override reason
    if (!eligibility.isEligible) {
      if (!overrideReason || overrideReason.trim().length < 10) {
        return res.status(400).json({
          error: `Student has attendance issue (${eligibility.statusLabel}). Administrator attendance override justification of at least 10 characters is mandatory to proceed with approval.`,
          requiresOverride: true,
          flagReason: eligibility.flagReason,
        });
      }
      newStatus = 'ADMIN_OVERRIDE_APPROVED';
      actionLabel = 'Approved with Authorized Attendance Override';
    } else {
      newStatus = 'ADMIN_APPROVED';
      actionLabel = 'Final Approval Granted';
    }
  } else if (decision === 'REJECT') {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return res.status(400).json({
        error: 'A formal reason for rejection is mandatory (minimum 5 characters).',
      });
    }
    newStatus = 'ADMIN_REJECTED';
    actionLabel = 'Final Request Rejected';
  } else if (decision === 'RETURN_CORRECTION') {
    if (!remarks || remarks.trim().length < 5) {
      return res.status(400).json({
        error: 'Correction instructions for the student are mandatory.',
      });
    }
    newStatus = 'ADMIN_RETURNED';
    actionLabel = 'Returned for Correction by Dean';
  } else {
    return res.status(400).json({ error: 'Invalid decision type.' });
  }

  const updatedRequest: EventRequest = {
    ...reqObj,
    status: newStatus,
    updatedAt: now,
    adminDecision: {
      decidedAt: now,
      decision,
      remarks: remarks || '',
      rejectionReason: decision === 'REJECT' ? rejectionReason : undefined,
      overrideReason: newStatus === 'ADMIN_OVERRIDE_APPROVED' ? overrideReason : undefined,
      adminName,
    },
    timeline: [
      ...reqObj.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actorName: adminName,
        actorRole: 'admin',
        action: actionLabel,
        remarks:
          decision === 'REJECT'
            ? `Rejection Reason: ${rejectionReason}`
            : newStatus === 'ADMIN_OVERRIDE_APPROVED'
            ? `Override Justification: ${overrideReason}`
            : remarks || 'Approved under university OD policy.',
      },
    ],
  };

  db.requests[reqIndex] = updatedRequest;

  // Notify student
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: reqObj.studentId,
    title:
      decision === 'APPROVE'
        ? 'Event Request Approved!'
        : decision === 'REJECT'
        ? 'Event Request Rejected'
        : 'Request Returned for Correction',
    message:
      decision === 'APPROVE'
        ? `Your request for "${reqObj.eventTitle}" was approved by ${adminName}.`
        : decision === 'REJECT'
        ? `Your request for "${reqObj.eventTitle}" was rejected: ${rejectionReason}`
        : `Your request for "${reqObj.eventTitle}" was returned by Dean with notes: ${remarks}`,
    type: decision === 'APPROVE' ? 'success' : decision === 'REJECT' ? 'error' : 'warning',
    requestId: reqObj.id,
    read: false,
    createdAt: now,
  });

  // Notify proctor
  if (reqObj.proctorId) {
    db.notifications.unshift({
      id: `notif-${Date.now()}-p`,
      userId: reqObj.proctorId,
      title: 'Final Decision: Student Request',
      message: `Admin ${adminName} finalized decision for ${reqObj.studentName} (${reqObj.rollNo}) - Status: ${newStatus}`,
      type: 'info',
      requestId: reqObj.id,
      read: false,
      createdAt: now,
    });
  }

  // Audit
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: admin?.id || 'admin',
    userName: adminName,
    userRole: 'admin',
    action: `ADMIN_DECISION_${decision}`,
    entityType: 'REQUEST',
    entityId: reqObj.id,
    details: `${actionLabel} for request ${reqObj.id} (${reqObj.studentName}). ${decision === 'REJECT' ? `Reason: ${rejectionReason}` : ''} ${newStatus === 'ADMIN_OVERRIDE_APPROVED' ? `Override: ${overrideReason}` : ''}`,
  });

  dbManager.saveDb(db);
  return res.json({ request: updatedRequest });
});

// Attendance file preview & validation
apiRouter.post('/admin/attendance/preview', (req: Request, res: Response) => {
  const { csvText, rows } = req.body;

  const db = dbManager.getDb();
  const students = db.users.filter(u => u.role === 'student');
  const studentRollMap = new Map(students.map(s => [s.studentDetails?.rollNo?.toUpperCase(), s]));

  let rawRows: any[] = [];

  if (Array.isArray(rows)) {
    rawRows = rows;
  } else if (typeof csvText === 'string') {
    // Parse CSV
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      return res.status(400).json({ error: 'CSV file is empty or contains only headers.' });
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rollIdx = header.findIndex(h => h.includes('roll') || h.includes('reg') || h.includes('id'));
    const conductedIdx = header.findIndex(h => h.includes('conducted') || h.includes('total'));
    const attendedIdx = header.findIndex(h => h.includes('attended') || h.includes('present'));
    const dateIdx = header.findIndex(h => h.includes('date') || h.includes('updated'));

    if (rollIdx === -1 || conductedIdx === -1 || attendedIdx === -1) {
      return res.status(400).json({
        error: 'CSV must contain columns for Roll No, Classes Conducted, and Classes Attended.',
      });
    }

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length >= 3) {
        rawRows.push({
          rollNo: parts[rollIdx],
          classesConducted: parseInt(parts[conductedIdx], 10),
          classesAttended: parseInt(parts[attendedIdx], 10),
          attendanceDate: dateIdx !== -1 && parts[dateIdx] ? parts[dateIdx] : new Date().toISOString().split('T')[0],
        });
      }
    }
  } else {
    return res.status(400).json({ error: 'csvText or rows array must be provided.' });
  }

  const previewRows: AttendanceImportPreviewRow[] = rawRows.map(r => {
    const rollNo = String(r.rollNo || '').trim().toUpperCase();
    const conducted = Number(r.classesConducted);
    const attended = Number(r.classesAttended);
    const dateStr = r.attendanceDate || new Date().toISOString().split('T')[0];

    let isValid = true;
    let validationError: string | undefined;

    if (!rollNo) {
      isValid = false;
      validationError = 'Roll Number is missing';
    } else if (isNaN(conducted) || conducted < 0) {
      isValid = false;
      validationError = 'Invalid classes conducted';
    } else if (isNaN(attended) || attended < 0) {
      isValid = false;
      validationError = 'Invalid classes attended';
    } else if (attended > conducted) {
      isValid = false;
      validationError = 'Attended classes cannot exceed conducted classes';
    }

    const percentage = isValid && conducted > 0 ? Number(((attended / conducted) * 100).toFixed(1)) : 0;
    const student = studentRollMap.get(rollNo);

    return {
      rollNo,
      name: student?.name,
      email: student?.email,
      classesConducted: conducted,
      classesAttended: attended,
      percentage,
      attendanceDate: dateStr,
      isValid,
      validationError,
      studentFound: !!student,
    };
  });

  const validCount = previewRows.filter(r => r.isValid).length;
  const errorCount = previewRows.filter(r => !r.isValid).length;

  return res.json({
    totalRows: previewRows.length,
    validCount,
    errorCount,
    preview: previewRows,
  });
});

apiRouter.post('/admin/attendance/confirm', (req: Request, res: Response) => {
  const { rows, adminId } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows provided to import.' });
  }

  const db = dbManager.getDb();
  let updatedCount = 0;
  const now = getTimestamp();

  rows.forEach((r: AttendanceImportPreviewRow) => {
    if (!r.isValid) return;

    const rollNo = r.rollNo.toUpperCase();
    const student = db.users.find(u => u.role === 'student' && u.studentDetails?.rollNo?.toUpperCase() === rollNo);
    const studentId = student?.id || `usr-stud-${rollNo}`;

    const existingAttIdx = db.attendance.findIndex(a => a.rollNo?.toUpperCase() === rollNo || a.studentId === studentId);
    const pct = r.classesConducted > 0 ? Number(((r.classesAttended / r.classesConducted) * 100).toFixed(1)) : 0;

    const record = {
      id: existingAttIdx !== -1 ? db.attendance[existingAttIdx].id : `att-${rollNo}`,
      studentId,
      rollNo,
      classesConducted: r.classesConducted,
      classesAttended: r.classesAttended,
      percentage: pct,
      lastUpdated: r.attendanceDate || now.split('T')[0],
      semester: 'Semester 5',
      academicYear: db.settings.academicYear,
    };

    if (existingAttIdx !== -1) {
      db.attendance[existingAttIdx] = record;
    } else {
      db.attendance.push(record);
    }
    updatedCount++;
  });

  const admin = db.users.find(u => u.id === adminId) || { name: 'Dean Dr. Evelyn Vance' };

  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: adminId || 'admin',
    userName: admin.name,
    userRole: 'admin',
    action: 'ATTENDANCE_BATCH_IMPORT',
    entityType: 'ATTENDANCE_IMPORT',
    details: `Imported and validated ${updatedCount} attendance records from spreadsheet. Calculated percentages using (attended / conducted).`,
  });

  dbManager.saveDb(db);
  return res.json({ success: true, updatedCount });
});

apiRouter.get('/admin/settings', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  return res.json({ settings: db.settings });
});

apiRouter.put('/admin/settings', (req: Request, res: Response) => {
  const { attendanceThreshold, freshnessLimitDays, adminId } = req.body;

  const db = dbManager.getDb();
  const oldThreshold = db.settings.attendanceThreshold;
  const oldFreshness = db.settings.freshnessLimitDays;

  if (attendanceThreshold !== undefined) {
    db.settings.attendanceThreshold = Number(attendanceThreshold);
  }
  if (freshnessLimitDays !== undefined) {
    db.settings.freshnessLimitDays = Number(freshnessLimitDays);
  }

  const now = getTimestamp();
  const admin = db.users.find(u => u.id === adminId) || { name: 'Dean Dr. Evelyn Vance' };

  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: now,
    userId: adminId || 'admin',
    userName: admin.name,
    userRole: 'admin',
    action: 'SETTINGS_UPDATE',
    entityType: 'SETTINGS',
    details: `Updated policy settings: Threshold changed from ${oldThreshold}% to ${db.settings.attendanceThreshold}%, Freshness limit changed from ${oldFreshness} to ${db.settings.freshnessLimitDays} days.`,
  });

  dbManager.saveDb(db);
  return res.json({ settings: db.settings });
});

apiRouter.get('/admin/audit-logs', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  return res.json({ auditLogs: db.auditLogs });
});

// CSV Export helpers
apiRouter.get('/admin/export/requests-csv', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  const headers = ['Request ID', 'Student Roll', 'Student Name', 'Department', 'Event Title', 'Category', 'Organizer', 'OD Days', 'Attendance %', 'Status', 'Proctor', 'Created At'];
  const rows = db.requests.map(r => [
    r.id,
    r.rollNo,
    `"${r.studentName}"`,
    `"${r.department}"`,
    `"${r.eventTitle.replace(/"/g, '""')}"`,
    r.category,
    `"${r.organizer.replace(/"/g, '""')}"`,
    r.odDays,
    r.attendanceSnapshot.percentage ?? 'N/A',
    r.status,
    `"${r.proctorName}"`,
    r.createdAt.split('T')[0],
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="permitrix_requests_report.csv"');
  return res.send(csv);
});

apiRouter.get('/admin/export/attendance-csv', (_req: Request, res: Response) => {
  const db = dbManager.getDb();
  const headers = ['Roll No', 'Student Name', 'Department', 'Classes Conducted', 'Classes Attended', 'Attendance %', 'Eligibility', 'Last Updated'];
  
  const rows = db.users.filter(u => u.role === 'student').map(s => {
    const roll = s.studentDetails?.rollNo || '';
    const att = db.attendance.find(a => a.studentId === s.id || a.rollNo === roll);
    const evalResult = dbManager.evaluateAttendanceEligibility(att, db.settings);
    return [
      roll,
      `"${s.name}"`,
      `"${s.department}"`,
      att?.classesConducted ?? 'N/A',
      att?.classesAttended ?? 'N/A',
      att?.percentage !== null && att?.percentage !== undefined ? `${att.percentage}%` : 'N/A',
      evalResult.statusLabel,
      att?.lastUpdated || 'Never',
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="permitrix_attendance_summary.csv"');
  return res.send(csv);
});

// Reset demo database
apiRouter.post('/admin/reset-demo', (_req: Request, res: Response) => {
  // Re-seed DB
  const fs = (dbManager as any);
  // Re-instantiate
  const db = (dbManager as any).cache = null;
  const newDb = dbManager.getDb();
  return res.json({ success: true, studentCount: newDb.users.filter(u => u.role === 'student').length });
});
