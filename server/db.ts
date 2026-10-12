import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  AttendanceRecord,
  EventRequest,
  SystemSettings,
  NotificationItem,
  AuditLogItem,
  RequestStatus,
} from '../src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'permitrix_db.json');

export interface DatabaseSchema {
  users: User[];
  attendance: AttendanceRecord[];
  requests: EventRequest[];
  settings: SystemSettings;
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

// Current date anchor for freshness calculation
const NOW_DATE = new Date('2026-10-12T04:00:00Z');

function dateDaysAgo(days: number): string {
  const d = new Date(NOW_DATE.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function dateTimeDaysAgo(days: number, hoursAgo = 0): string {
  const d = new Date(NOW_DATE.getTime() - (days * 24 + hoursAgo) * 60 * 60 * 1000);
  return d.toISOString();
}

function getInitialDatabase(): DatabaseSchema {
  const settings: SystemSettings = {
    attendanceThreshold: 75,
    freshnessLimitDays: 30,
    universityName: 'Apex Institute of Technology & Sciences',
    portalName: 'Permitrix',
    academicYear: '2026-2027',
    semester: 'Fall / Odd Semester',
  };

  const users: User[] = [
    {
      id: 'usr-admin-1',
      email: 'admin@university.edu',
      name: 'Dr. Evelyn Vance',
      role: 'admin',
      password: 'admin123',
      department: 'Academic Affairs & Administration',
      phone: '+1 (555) 019-8234',
      createdAt: dateTimeDaysAgo(120),
    },
    {
      id: 'usr-proctor-sharma',
      email: 'proctor.sharma@university.edu',
      name: 'Prof. Rajesh Sharma',
      role: 'proctor',
      password: 'proctor123',
      department: 'Computer Science & Engineering',
      phone: '+1 (555) 019-3341',
      proctorDetails: {
        designation: 'Associate Professor & Senior Proctor',
        cabin: 'Tech Block B, Room 304',
      },
      createdAt: dateTimeDaysAgo(120),
    },
    {
      id: 'usr-proctor-chen',
      email: 'proctor.chen@university.edu',
      name: 'Prof. Mei Chen',
      role: 'proctor',
      password: 'proctor123',
      department: 'Information Technology & AI',
      phone: '+1 (555) 019-7729',
      proctorDetails: {
        designation: 'Associate Professor & Proctor',
        cabin: 'IT Complex, Room 212',
      },
      createdAt: dateTimeDaysAgo(120),
    },
  ];

  // 36 Student definitions
  const studentDataRaw = [
    // Assigned to Prof. Sharma (1 to 18)
    { roll: '23CS001', name: 'Aarav Patel', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 125, attended: 114, daysAgo: 4 }, // 91.2%
    { roll: '23CS002', name: 'Diya Sengupta', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 120, attended: 105, daysAgo: 5 }, // 87.5%
    { roll: '23CS003', name: 'Rohan Nair', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 112, attended: 92, daysAgo: 8 }, // 82.1%
    { roll: '23CS004', name: 'Ananya Iyer', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 125, attended: 96, daysAgo: 6 }, // 76.8%
    { roll: '23CS005', name: 'Vikram Malhotra', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 119, attended: 85, daysAgo: 10 }, // 71.4% (Below)
    { roll: '23CS006', name: 'Sneha Kulkarni', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 125, attended: 85, daysAgo: 7 }, // 68.0% (Below)
    { roll: '23CS007', name: 'Kabir Mehta', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 120, attended: 102, daysAgo: 5 }, // 85.0%
    { roll: '23CS008', name: 'Ishita Roy', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 116, attended: 109, daysAgo: 3 }, // 94.0%
    { roll: '23CS009', name: 'Tanmay Joshi', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 120, attended: 75, daysAgo: 9 }, // 62.5% (Below)
    { roll: '23CS010', name: 'Pooja Reddy', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: null, attended: null, daysAgo: null }, // Missing
    { roll: '23CS011', name: 'Aditya Verma', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 115, attended: 92, daysAgo: 52 }, // 80.0% (Outdated 52 days)
    { roll: '23CS012', name: 'Meera Menon', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 112, attended: 100, daysAgo: 4 }, // 89.3%
    { roll: '23CS013', name: 'Karthik Sundaram', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 114, attended: 88, daysAgo: 6 }, // 77.2%
    { roll: '23CS014', name: 'Ritu Deshmukh', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 117, attended: 75, daysAgo: 11 }, // 64.1% (Below)
    { roll: '23CS015', name: 'Siddharth Rao', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 120, attended: 111, daysAgo: 2 }, // 92.5%
    { roll: '23CS016', name: 'Natasha Gupta', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: null, attended: null, daysAgo: null }, // Missing
    { roll: '23CS017', name: 'Farhan Khan', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 117, attended: 99, daysAgo: 8 }, // 84.6%
    { roll: '23CS018', name: 'Lavanya Bhat', proctor: 'usr-proctor-sharma', dept: 'Computer Science', conducted: 112, attended: 82, daysAgo: 7 }, // 73.2% (Below)

    // Assigned to Prof. Chen (19 to 36)
    { roll: '23CS019', name: 'Arjun Singhania', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 121, attended: 107, daysAgo: 4 }, // 88.4%
    { roll: '23CS020', name: 'Shruti Pillai', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 125, attended: 80, daysAgo: 9 }, // 64.0% (Below)
    { roll: '23CS021', name: 'Devendra Prasad', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 115, attended: 96, daysAgo: 7 }, // 83.5%
    { roll: '23CS022', name: 'Alisha D Souza', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 110, attended: 87, daysAgo: 48 }, // 79.0% (Outdated 48 days)
    { roll: '23CS023', name: 'Varun Nambiar', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: null, attended: null, daysAgo: null }, // Missing
    { roll: '23CS024', name: 'Tanya Chawla', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 120, attended: 114, daysAgo: 3 }, // 95.0%
    { roll: '23CS025', name: 'Nikhil Bhattacharya', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 113, attended: 80, daysAgo: 10 }, // 70.8% (Below)
    { roll: '23CS026', name: 'Sanjana Das', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 116, attended: 100, daysAgo: 5 }, // 86.2%
    { roll: '23CS027', name: 'Yashwant Kumar', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 114, attended: 90, daysAgo: 6 }, // 78.9%
    { roll: '23CS028', name: 'Bhavna Somani', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 120, attended: 110, daysAgo: 4 }, // 91.7%
    { roll: '23CS029', name: 'Pranav Tiwari', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 117, attended: 72, daysAgo: 8 }, // 61.5% (Below)
    { roll: '23CS030', name: 'Kavya Natarajan', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 125, attended: 110, daysAgo: 2 }, // 88.0%
    { roll: '23CS031', name: 'Rishabh Saxena', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 115, attended: 88, daysAgo: 7 }, // 76.5%
    { roll: '23CS032', name: 'Swati Aggarwal', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: null, attended: null, daysAgo: null }, // Missing
    { roll: '23CS033', name: 'Harish Pillai', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 117, attended: 95, daysAgo: 44 }, // 81.2% (Outdated 44 days)
    { roll: '23CS034', name: 'Zainab Fatima', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 114, attended: 102, daysAgo: 5 }, // 89.5%
    { roll: '23CS035', name: 'Aman Bansal', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 125, attended: 90, daysAgo: 6 }, // 72.0% (Below)
    { roll: '23CS036', name: 'Charulata Sen', proctor: 'usr-proctor-chen', dept: 'Information Tech', conducted: 116, attended: 108, daysAgo: 3 }, // 93.1%
  ];

  const attendance: AttendanceRecord[] = [];

  studentDataRaw.forEach((s, idx) => {
    const studentId = `usr-stud-${String(idx + 1).padStart(3, '0')}`;
    const emailPrefix = s.name.toLowerCase().replace(/['\s]/g, '.');
    const email = `student.${emailPrefix}@university.edu`;

    users.push({
      id: studentId,
      email,
      name: s.name,
      role: 'student',
      password: 'student123',
      department: s.dept,
      phone: `+1 (555) 018-${String(1000 + idx).slice(1)}`,
      studentDetails: {
        rollNo: s.roll,
        registerNo: `REG2023CS${String(idx + 1).padStart(3, '0')}`,
        proctorId: s.proctor,
        batch: '2023-2027',
        section: idx < 18 ? 'A' : 'B',
      },
      createdAt: dateTimeDaysAgo(90),
    });

    const pct = s.conducted !== null && s.attended !== null && s.conducted > 0
      ? Number(((s.attended / s.conducted) * 100).toFixed(1))
      : null;

    attendance.push({
      id: `att-${s.roll}`,
      studentId,
      rollNo: s.roll,
      classesConducted: s.conducted,
      classesAttended: s.attended,
      percentage: pct,
      lastUpdated: s.daysAgo !== null ? dateDaysAgo(s.daysAgo) : null,
      semester: 'Semester 5',
      academicYear: '2026-2027',
    });
  });

  // At least 12 sample event requests across all workflow statuses
  const requests: EventRequest[] = [
    {
      id: 'REQ-2026-001',
      studentId: 'usr-stud-001',
      studentName: 'Aarav Patel',
      rollNo: '23CS001',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'National University Hackathon 2026',
      category: 'Hackathon',
      organizer: 'Indian Institute of Technology (IIT) Delhi',
      location: 'New Delhi (In-Person)',
      mode: 'In-Person',
      startDate: '2026-10-24',
      endDate: '2026-10-26',
      odDays: 3,
      justification: 'Selected as top 10 finalist team for AI in Healthcare track. Seeking OD for travel and 48-hour prototype demonstration.',
      supportingDocName: 'IITD_Hackathon_Finalist_Invitation.pdf',
      status: 'SUBMITTED',
      attendanceSnapshot: {
        conducted: 125,
        attended: 114,
        percentage: 91.2,
        lastUpdated: dateDaysAgo(4),
        isEligible: true,
      },
      timeline: [
        {
          id: 'tl-1',
          timestamp: dateTimeDaysAgo(1, 4),
          actorName: 'Aarav Patel',
          actorRole: 'student',
          action: 'Submitted Request',
          remarks: 'Submitted request with invitation letter.',
        },
      ],
      createdAt: dateTimeDaysAgo(1, 4),
      updatedAt: dateTimeDaysAgo(1, 4),
    },
    {
      id: 'REQ-2026-002',
      studentId: 'usr-stud-002',
      studentName: 'Diya Sengupta',
      rollNo: '23CS002',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'IEEE International Conference on Neural Networks',
      category: 'Conference',
      organizer: 'IEEE Computational Intelligence Society',
      location: 'Bengaluru Convention Center',
      mode: 'In-Person',
      startDate: '2026-11-05',
      endDate: '2026-11-07',
      odDays: 3,
      justification: 'Oral research paper presentation on "Optimized Transformer Attention in Low-Power Edge Devices". Student is lead author.',
      supportingDocName: 'IEEE_ICNN_Acceptance_Letter.pdf',
      status: 'PROCTOR_RECOMMENDED',
      attendanceSnapshot: {
        conducted: 120,
        attended: 105,
        percentage: 87.5,
        lastUpdated: dateDaysAgo(5),
        isEligible: true,
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(2),
        recommendation: 'RECOMMEND_APPROVE',
        remarks: 'Prestigious peer-reviewed IEEE oral presentation. Student holds 87.5% attendance and no disciplinary record. Strongly recommended.',
        proctorName: 'Prof. Rajesh Sharma',
      },
      timeline: [
        {
          id: 'tl-2a',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Diya Sengupta',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-2b',
          timestamp: dateTimeDaysAgo(2),
          actorName: 'Prof. Rajesh Sharma',
          actorRole: 'proctor',
          action: 'Recommended Approval',
          remarks: 'Prestigious peer-reviewed IEEE oral presentation. Strongly recommended.',
        },
      ],
      createdAt: dateTimeDaysAgo(3),
      updatedAt: dateTimeDaysAgo(2),
    },
    {
      id: 'REQ-2026-003',
      studentId: 'usr-stud-003',
      studentName: 'Rohan Nair',
      rollNo: '23CS003',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'National Cyber Security CTF Challenge',
      category: 'Coding Contest',
      organizer: 'National Critical Information Infrastructure Protection Centre',
      location: 'Hyderabad Tech Zone',
      mode: 'In-Person',
      startDate: '2026-10-18',
      endDate: '2026-10-19',
      odDays: 2,
      justification: 'University CTF team qualified for South Zone finals. Competing in reverse engineering and binary exploitation tracks.',
      supportingDocName: 'CTF_Finals_Admit_Pass.pdf',
      status: 'ADMIN_APPROVED',
      attendanceSnapshot: {
        conducted: 112,
        attended: 92,
        percentage: 82.1,
        lastUpdated: dateDaysAgo(8),
        isEligible: true,
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(5),
        recommendation: 'RECOMMEND_APPROVE',
        remarks: 'Qualified in competitive rounds. 82.1% attendance meets requirements.',
        proctorName: 'Prof. Rajesh Sharma',
      },
      adminDecision: {
        decidedAt: dateTimeDaysAgo(4),
        decision: 'APPROVE',
        remarks: 'Approved for 2 days On-Duty status. Student must submit participation certificate within 3 working days post-event.',
        adminName: 'Dr. Evelyn Vance',
      },
      timeline: [
        {
          id: 'tl-3a',
          timestamp: dateTimeDaysAgo(6),
          actorName: 'Rohan Nair',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-3b',
          timestamp: dateTimeDaysAgo(5),
          actorName: 'Prof. Rajesh Sharma',
          actorRole: 'proctor',
          action: 'Recommended Approval',
          remarks: 'Qualified in competitive rounds. Verified.',
        },
        {
          id: 'tl-3c',
          timestamp: dateTimeDaysAgo(4),
          actorName: 'Dr. Evelyn Vance',
          actorRole: 'admin',
          action: 'Final Approval Granted',
          remarks: 'Approved for 2 days OD leave.',
        },
      ],
      createdAt: dateTimeDaysAgo(6),
      updatedAt: dateTimeDaysAgo(4),
    },
    {
      id: 'REQ-2026-004',
      studentId: 'usr-stud-004',
      studentName: 'Ananya Iyer',
      rollNo: '23CS004',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'Cloud Native DevOps Summit & Expo',
      category: 'Workshop',
      organizer: 'Cloud Native Computing Foundation (CNCF)',
      location: 'Virtual / Online',
      mode: 'Virtual',
      startDate: '2026-10-14',
      endDate: '2026-10-15',
      odDays: 2,
      justification: 'Hands-on Kubernetes and service mesh masterclass during university lecture hours.',
      supportingDocName: 'CNCF_Registration_Confirmation.pdf',
      status: 'ADMIN_REJECTED',
      attendanceSnapshot: {
        conducted: 125,
        attended: 96,
        percentage: 76.8,
        lastUpdated: dateDaysAgo(6),
        isEligible: true,
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(3),
        recommendation: 'RECOMMEND_APPROVE',
        remarks: 'Attendance meets minimum 75%. Good workshop.',
        proctorName: 'Prof. Rajesh Sharma',
      },
      adminDecision: {
        decidedAt: dateTimeDaysAgo(2),
        decision: 'REJECT',
        remarks: 'Virtual workshops without live evaluation do not warrant full duty leave during core lab instruction weeks.',
        rejectionReason: 'Virtual event during active laboratory practical exam cycle; duty leave policy restricts non-competitive virtual summits.',
        adminName: 'Dr. Evelyn Vance',
      },
      timeline: [
        {
          id: 'tl-4a',
          timestamp: dateTimeDaysAgo(4),
          actorName: 'Ananya Iyer',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-4b',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Prof. Rajesh Sharma',
          actorRole: 'proctor',
          action: 'Recommended Approval',
        },
        {
          id: 'tl-4c',
          timestamp: dateTimeDaysAgo(2),
          actorName: 'Dr. Evelyn Vance',
          actorRole: 'admin',
          action: 'Final Rejection',
          remarks: 'Virtual event during active laboratory practical exam cycle.',
        },
      ],
      createdAt: dateTimeDaysAgo(4),
      updatedAt: dateTimeDaysAgo(2),
    },
    {
      id: 'REQ-2026-005',
      studentId: 'usr-stud-005',
      studentName: 'Vikram Malhotra',
      rollNo: '23CS005',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'National Robotics Expo & BattleBots',
      category: 'Project Expo',
      organizer: 'National Institute of Technology (NIT) Trichy',
      location: 'NIT Campus, Trichy',
      mode: 'In-Person',
      startDate: '2026-11-12',
      endDate: '2026-11-14',
      odDays: 3,
      justification: 'Displaying 15kg combat robot in university robotics club contingent.',
      supportingDocName: 'Incomplete_Brochure.pdf',
      status: 'PROCTOR_RETURNED',
      attendanceSnapshot: {
        conducted: 119,
        attended: 85,
        percentage: 71.4,
        lastUpdated: dateDaysAgo(10),
        isEligible: false,
        flagReason: 'Attendance (71.4%) is below 75% threshold',
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(1),
        recommendation: 'RETURN_CORRECTION',
        remarks: 'Attendance is 71.4% (below 75%). Please attach official Faculty Advisor endorsement and proof of college robotics club sponsorship to proceed for Dean review.',
        proctorName: 'Prof. Rajesh Sharma',
      },
      timeline: [
        {
          id: 'tl-5a',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Vikram Malhotra',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-5b',
          timestamp: dateTimeDaysAgo(1),
          actorName: 'Prof. Rajesh Sharma',
          actorRole: 'proctor',
          action: 'Returned for Correction',
          remarks: 'Attendance below 75%. Attach official faculty advisor endorsement.',
        },
      ],
      createdAt: dateTimeDaysAgo(3),
      updatedAt: dateTimeDaysAgo(1),
    },
    {
      id: 'REQ-2026-006',
      studentId: 'usr-stud-006',
      studentName: 'Sneha Kulkarni',
      rollNo: '23CS006',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'Global DevFest 2026 Hackathon',
      category: 'Hackathon',
      organizer: 'Google Developer Groups & Tech Hub',
      location: 'Bengaluru Tech Park',
      mode: 'In-Person',
      startDate: '2026-10-28',
      endDate: '2026-10-30',
      odDays: 3,
      justification: 'University lead for Smart City Solution track. Required to attend demo pitching.',
      supportingDocName: 'DevFest_Shortlist_Letter.pdf',
      status: 'ADMIN_OVERRIDE_APPROVED',
      attendanceSnapshot: {
        conducted: 125,
        attended: 85,
        percentage: 68.0,
        lastUpdated: dateDaysAgo(7),
        isEligible: false,
        flagReason: 'Attendance (68.0%) is below 75% threshold',
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(4),
        recommendation: 'RECOMMEND_APPROVE',
        remarks: 'Student had verified medical leave earlier in semester. Performance in labs is outstanding (9.2 GPA). Recommend special administrative consideration.',
        proctorName: 'Prof. Rajesh Sharma',
      },
      adminDecision: {
        decidedAt: dateTimeDaysAgo(3),
        decision: 'APPROVE',
        remarks: 'Dean special dispensation granted.',
        overrideReason: 'Dean Authorized Attendance Override: Verified hospital admission documents on file from August; student represents university as lead innovator.',
        adminName: 'Dr. Evelyn Vance',
      },
      timeline: [
        {
          id: 'tl-6a',
          timestamp: dateTimeDaysAgo(5),
          actorName: 'Sneha Kulkarni',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-6b',
          timestamp: dateTimeDaysAgo(4),
          actorName: 'Prof. Rajesh Sharma',
          actorRole: 'proctor',
          action: 'Recommended Approval with Note',
          remarks: 'Medical leave on record. Recommend admin consideration.',
        },
        {
          id: 'tl-6c',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Dr. Evelyn Vance',
          actorRole: 'admin',
          action: 'Authorized Override & Approved',
          remarks: 'Dean Authorized Attendance Override: Verified hospital admission documents on file.',
        },
      ],
      createdAt: dateTimeDaysAgo(5),
      updatedAt: dateTimeDaysAgo(3),
    },
    {
      id: 'REQ-2026-007',
      studentId: 'usr-stud-007',
      studentName: 'Kabir Mehta',
      rollNo: '23CS007',
      department: 'Computer Science',
      proctorId: 'usr-proctor-sharma',
      proctorName: 'Prof. Rajesh Sharma',
      eventTitle: 'Open Source FOSS Conclave',
      category: 'Conference',
      organizer: 'Free Software Foundation India',
      location: 'Pune University Campus',
      mode: 'In-Person',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      odDays: 2,
      justification: 'Presenting lightning talk on open-source accessibility tools for visually impaired students. Document updated with itinerary.',
      supportingDocName: 'FOSS_Invitation_Updated_Schedule.pdf',
      status: 'RESUBMITTED',
      attendanceSnapshot: {
        conducted: 120,
        attended: 102,
        percentage: 85.0,
        lastUpdated: dateDaysAgo(5),
        isEligible: true,
      },
      timeline: [
        {
          id: 'tl-7a',
          timestamp: dateTimeDaysAgo(5),
          actorName: 'Kabir Mehta',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-7b',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Prof. Rajesh Sharma',
          actorRole: 'proctor',
          action: 'Returned for Correction',
          remarks: 'Please attach detailed speaker schedule with your name included.',
        },
        {
          id: 'tl-7c',
          timestamp: dateTimeDaysAgo(1),
          actorName: 'Kabir Mehta',
          actorRole: 'student',
          action: 'Resubmitted Request',
          remarks: 'Attached updated schedule confirming speaker slot at 11:30 AM on Day 1.',
        },
      ],
      createdAt: dateTimeDaysAgo(5),
      updatedAt: dateTimeDaysAgo(1),
    },
    {
      id: 'REQ-2026-008',
      studentId: 'usr-stud-019',
      studentName: 'Arjun Singhania',
      rollNo: '23CS019',
      department: 'Information Tech',
      proctorId: 'usr-proctor-chen',
      proctorName: 'Prof. Mei Chen',
      eventTitle: 'Mobile App Innovation Sprint',
      category: 'Hackathon',
      organizer: 'Apple Developer Academy & Tech Innovation Lab',
      location: 'Hyderabad Tech Hub',
      mode: 'In-Person',
      startDate: '2026-10-21',
      endDate: '2026-10-23',
      odDays: 3,
      justification: 'Swift Student Challenge mentoring sprint and 48-hour build contest.',
      supportingDocName: 'Apple_Sprint_Invite_Ticket.pdf',
      status: 'SUBMITTED',
      attendanceSnapshot: {
        conducted: 121,
        attended: 107,
        percentage: 88.4,
        lastUpdated: dateDaysAgo(4),
        isEligible: true,
      },
      timeline: [
        {
          id: 'tl-8',
          timestamp: dateTimeDaysAgo(1, 10),
          actorName: 'Arjun Singhania',
          actorRole: 'student',
          action: 'Submitted Request',
        },
      ],
      createdAt: dateTimeDaysAgo(1, 10),
      updatedAt: dateTimeDaysAgo(1, 10),
    },
    {
      id: 'REQ-2026-009',
      studentId: 'usr-stud-020',
      studentName: 'Shruti Pillai',
      rollNo: '23CS020',
      department: 'Information Tech',
      proctorId: 'usr-proctor-chen',
      proctorName: 'Prof. Mei Chen',
      eventTitle: 'Data Science & Predictive AI Symposium',
      category: 'Technical Symposium',
      organizer: 'Society for Industrial & Applied Mathematics',
      location: 'Chennai Trade Centre',
      mode: 'In-Person',
      startDate: '2026-10-29',
      endDate: '2026-10-30',
      odDays: 2,
      justification: 'Attending symposium paper tracks.',
      supportingDocName: 'Attendee_Pass_Ticket.pdf',
      status: 'PROCTOR_RECOMMENDED_REJECT',
      attendanceSnapshot: {
        conducted: 125,
        attended: 80,
        percentage: 64.0,
        lastUpdated: dateDaysAgo(9),
        isEligible: false,
        flagReason: 'Attendance (64.0%) is below 75% threshold',
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(2),
        recommendation: 'RECOMMEND_REJECT',
        remarks: 'Student has critical attendance shortage (64.0%) and is an observer attendee rather than an author or speaker. Non-essential absence.',
        proctorName: 'Prof. Mei Chen',
      },
      timeline: [
        {
          id: 'tl-9a',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Shruti Pillai',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-9b',
          timestamp: dateTimeDaysAgo(2),
          actorName: 'Prof. Mei Chen',
          actorRole: 'proctor',
          action: 'Recommended Rejection',
          remarks: 'Critical attendance shortage (64.0%). Observer status only.',
        },
      ],
      createdAt: dateTimeDaysAgo(3),
      updatedAt: dateTimeDaysAgo(2),
    },
    {
      id: 'REQ-2026-010',
      studentId: 'usr-stud-021',
      studentName: 'Devendra Prasad',
      rollNo: '23CS021',
      department: 'Information Tech',
      proctorId: 'usr-proctor-chen',
      proctorName: 'Prof. Mei Chen',
      eventTitle: 'National Bioinformatics Conclave',
      category: 'Paper Presentation',
      organizer: 'All India Institute of Medical Informatics',
      location: 'Kolkata Science City',
      mode: 'In-Person',
      startDate: '2026-11-18',
      endDate: '2026-11-20',
      odDays: 3,
      justification: 'Presenting research paper on genomics data pipelines.',
      supportingDocName: 'Bioinformatics_Paper_Abstract.pdf',
      status: 'ADMIN_RETURNED',
      attendanceSnapshot: {
        conducted: 115,
        attended: 96,
        percentage: 83.5,
        lastUpdated: dateDaysAgo(7),
        isEligible: true,
      },
      proctorReview: {
        reviewedAt: dateTimeDaysAgo(3),
        recommendation: 'RECOMMEND_APPROVE',
        remarks: '83.5% attendance, good research contribution.',
        proctorName: 'Prof. Mei Chen',
      },
      adminDecision: {
        decidedAt: dateTimeDaysAgo(1),
        decision: 'RETURN_CORRECTION',
        remarks: 'Please furnish the co-authorship letter signed by Department Head for multi-day outstation travel approval.',
        adminName: 'Dr. Evelyn Vance',
      },
      timeline: [
        {
          id: 'tl-10a',
          timestamp: dateTimeDaysAgo(4),
          actorName: 'Devendra Prasad',
          actorRole: 'student',
          action: 'Submitted Request',
        },
        {
          id: 'tl-10b',
          timestamp: dateTimeDaysAgo(3),
          actorName: 'Prof. Mei Chen',
          actorRole: 'proctor',
          action: 'Recommended Approval',
        },
        {
          id: 'tl-10c',
          timestamp: dateTimeDaysAgo(1),
          actorName: 'Dr. Evelyn Vance',
          actorRole: 'admin',
          action: 'Returned for Correction',
          remarks: 'Furnish co-authorship letter signed by HOD.',
        },
      ],
      createdAt: dateTimeDaysAgo(4),
      updatedAt: dateTimeDaysAgo(1),
    },
    {
      id: 'REQ-2026-011',
      studentId: 'usr-stud-022',
      studentName: 'Alisha D Souza',
      rollNo: '23CS022',
      department: 'Information Tech',
      proctorId: 'usr-proctor-chen',
      proctorName: 'Prof. Mei Chen',
      eventTitle: 'Quantum Algorithms Bootcamp',
      category: 'Workshop',
      organizer: 'IBM Quantum Educators Network',
      location: 'Virtual / Online',
      mode: 'Virtual',
      startDate: '2026-10-25',
      endDate: '2026-10-26',
      odDays: 2,
      justification: 'Selected for competitive IBM Quantum student cohort.',
      supportingDocName: 'IBM_Quantum_Cohort_Selection.pdf',
      status: 'SUBMITTED',
      attendanceSnapshot: {
        conducted: 110,
        attended: 87,
        percentage: 79.0,
        lastUpdated: dateDaysAgo(48), // 48 days old (> 30 days freshness limit!)
        isEligible: false,
        flagReason: 'Attendance data is outdated (updated 48 days ago, exceeds 30-day limit)',
      },
      timeline: [
        {
          id: 'tl-11',
          timestamp: dateTimeDaysAgo(2),
          actorName: 'Alisha D Souza',
          actorRole: 'student',
          action: 'Submitted Request',
          remarks: 'Submitted request. Note: Attendance record flag triggered for freshness verification.',
        },
      ],
      createdAt: dateTimeDaysAgo(2),
      updatedAt: dateTimeDaysAgo(2),
    },
    {
      id: 'REQ-2026-012',
      studentId: 'usr-stud-023',
      studentName: 'Varun Nambiar',
      rollNo: '23CS023',
      department: 'Information Tech',
      proctorId: 'usr-proctor-chen',
      proctorName: 'Prof. Mei Chen',
      eventTitle: 'Smart India Hardware Hackathon',
      category: 'Hackathon',
      organizer: 'Ministry of Education Innovation Cell',
      location: 'Mumbai Nodal Center',
      mode: 'In-Person',
      startDate: '2026-11-08',
      endDate: '2026-11-10',
      odDays: 3,
      justification: 'Qualified team member for hardware prototype build.',
      supportingDocName: 'SIH_Hardware_Team_Selection.pdf',
      status: 'SUBMITTED',
      attendanceSnapshot: {
        conducted: null,
        attended: null,
        percentage: null,
        lastUpdated: null,
        isEligible: false,
        flagReason: 'Missing attendance data - verification required prior to approval',
      },
      timeline: [
        {
          id: 'tl-12',
          timestamp: dateTimeDaysAgo(1, 2),
          actorName: 'Varun Nambiar',
          actorRole: 'student',
          action: 'Submitted Request',
          remarks: 'Submitted. Missing attendance record must be imported/verified.',
        },
      ],
      createdAt: dateTimeDaysAgo(1, 2),
      updatedAt: dateTimeDaysAgo(1, 2),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'usr-stud-003',
      title: 'Event Request Approved',
      message: 'Your request for "National Cyber Security CTF Challenge" has been approved by Dean Dr. Evelyn Vance for 2 OD days.',
      type: 'success',
      requestId: 'REQ-2026-003',
      read: true,
      createdAt: dateTimeDaysAgo(4),
    },
    {
      id: 'notif-2',
      userId: 'usr-stud-004',
      title: 'Event Request Status Update',
      message: 'Your request for "Cloud Native DevOps Summit" was reviewed by administration.',
      type: 'error',
      requestId: 'REQ-2026-004',
      read: false,
      createdAt: dateTimeDaysAgo(2),
    },
    {
      id: 'notif-3',
      userId: 'usr-stud-005',
      title: 'Action Required: Request Returned',
      message: 'Your proctor Prof. Rajesh Sharma returned request "National Robotics Expo" with remarks for correction.',
      type: 'warning',
      requestId: 'REQ-2026-005',
      read: false,
      createdAt: dateTimeDaysAgo(1),
    },
    {
      id: 'notif-4',
      userId: 'usr-proctor-sharma',
      title: 'New Event Requests Pending Review',
      message: 'Student Aarav Patel submitted a request for "National University Hackathon 2026".',
      type: 'info',
      requestId: 'REQ-2026-001',
      read: false,
      createdAt: dateTimeDaysAgo(1, 4),
    },
    {
      id: 'notif-5',
      userId: 'usr-admin-1',
      title: 'Proctor Recommendation Received',
      message: 'Prof. Rajesh Sharma recommended approval for Diya Sengupta (IEEE International Conference). Awaiting your decision.',
      type: 'info',
      requestId: 'REQ-2026-002',
      read: false,
      createdAt: dateTimeDaysAgo(2),
    },
  ];

  const auditLogs: AuditLogItem[] = [
    {
      id: 'audit-1',
      timestamp: dateTimeDaysAgo(14),
      userId: 'usr-admin-1',
      userName: 'Dr. Evelyn Vance',
      userRole: 'admin',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'SETTINGS',
      details: 'Permitrix Academic Session initialized. Default threshold set to 75%, freshness set to 30 days.',
    },
    {
      id: 'audit-2',
      timestamp: dateTimeDaysAgo(12),
      userId: 'usr-admin-1',
      userName: 'Dr. Evelyn Vance',
      userRole: 'admin',
      action: 'BATCH_ATTENDANCE_IMPORTED',
      entityType: 'ATTENDANCE_IMPORT',
      details: 'Uploaded Semester 5 interim attendance master spreadsheet (32 verified records).',
    },
    {
      id: 'audit-3',
      timestamp: dateTimeDaysAgo(4),
      userId: 'usr-admin-1',
      userName: 'Dr. Evelyn Vance',
      userRole: 'admin',
      action: 'REQUEST_FINAL_APPROVAL',
      entityType: 'REQUEST',
      entityId: 'REQ-2026-003',
      details: 'Approved request REQ-2026-003 for Rohan Nair (National Cyber Security CTF). OD days: 2.',
    },
    {
      id: 'audit-4',
      timestamp: dateTimeDaysAgo(3),
      userId: 'usr-admin-1',
      userName: 'Dr. Evelyn Vance',
      userRole: 'admin',
      action: 'REQUEST_ATTENDANCE_OVERRIDE_APPROVED',
      entityType: 'REQUEST',
      entityId: 'REQ-2026-006',
      details: 'Authorized attendance override (68.0% < 75%) for Sneha Kulkarni on medical and national team representation grounds.',
    },
    {
      id: 'audit-5',
      timestamp: dateTimeDaysAgo(2),
      userId: 'usr-admin-1',
      userName: 'Dr. Evelyn Vance',
      userRole: 'admin',
      action: 'REQUEST_FINAL_REJECTION',
      entityType: 'REQUEST',
      entityId: 'REQ-2026-004',
      details: 'Rejected request REQ-2026-004 for Ananya Iyer. Reason: Non-competitive virtual event during practical examination week.',
    },
  ];

  return {
    users,
    attendance,
    requests,
    settings,
    notifications,
    auditLogs,
  };
}

class DatabaseManager {
  private cache: DatabaseSchema | null = null;

  private ensureDir() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  public getDb(): DatabaseSchema {
    if (this.cache) return this.cache;

    this.ensureDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        // Verify database integrity - check if students count >= 36
        const studentCount = parsed.users.filter(u => u.role === 'student').length;
        if (studentCount >= 36 && parsed.requests.length >= 10) {
          this.cache = parsed;
          return this.cache;
        }
      } catch (err) {
        console.error('Failed reading existing db, re-seeding:', err);
      }
    }

    // Initialize with comprehensive demo data
    const initial = getInitialDatabase();
    this.saveDb(initial);
    this.cache = initial;
    return this.cache;
  }

  public saveDb(data: DatabaseSchema): void {
    this.ensureDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    this.cache = data;
  }

  public evaluateAttendanceEligibility(
    record: AttendanceRecord | undefined,
    settings: SystemSettings,
  ): { isEligible: boolean; statusLabel: 'Eligible' | 'Shortage' | 'Missing Data' | 'Outdated Data'; statusColor: 'emerald' | 'amber' | 'rose' | 'slate'; flagReason?: string; daysOld?: number } {
    if (!record || record.classesConducted === null || record.classesAttended === null || record.classesConducted === 0) {
      return {
        isEligible: false,
        statusLabel: 'Missing Data',
        statusColor: 'rose',
        flagReason: 'Missing attendance data - verification required prior to approval',
      };
    }

    let daysOld = 0;
    if (record.lastUpdated) {
      const updateDate = new Date(record.lastUpdated);
      const diffTime = Math.abs(NOW_DATE.getTime() - updateDate.getTime());
      daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    if (!record.lastUpdated || daysOld > settings.freshnessLimitDays) {
      return {
        isEligible: false,
        statusLabel: 'Outdated Data',
        statusColor: 'amber',
        flagReason: `Attendance record is outdated (${daysOld} days old, exceeds ${settings.freshnessLimitDays}-day limit)`,
        daysOld,
      };
    }

    const pct = record.percentage ?? Number(((record.classesAttended / record.classesConducted) * 100).toFixed(1));
    if (pct < settings.attendanceThreshold) {
      return {
        isEligible: false,
        statusLabel: 'Shortage',
        statusColor: 'amber',
        flagReason: `Attendance (${pct}%) is below required threshold of ${settings.attendanceThreshold}%`,
        daysOld,
      };
    }

    return {
      isEligible: true,
      statusLabel: 'Eligible',
      statusColor: 'emerald',
      daysOld,
    };
  }
}

export const dbManager = new DatabaseManager();
