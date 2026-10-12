# Permitrix — University Technical-Event Approvals and Attendance Monitoring System

Permitrix is a responsive full-stack university governance portal designed for managing students' On-Duty (OD) technical event permissions, verifying attendance eligibility, coordinating multi-stage proctor & dean approvals, and bulk-importing attendance records via Excel/CSV.

---

## 1. Core Architecture & Roles

Permitrix implements a strict 3-tier Role-Based Access Control (RBAC) model with separate entry points:

### 🎓 1. Student Portal (`/student/login` & `/student`)
- **Personal Attendance Metrics**: View live percentage calculated as `(classes attended / classes conducted) * 100`, total attended/conducted, last updated date, and data freshness indicator.
- **Eligibility Alerts**: Instant visual alerts if attendance is below the institutional threshold (default: 75%), if attendance data is outdated (> 30 days old), or if attendance records are missing.
- **Event OD Request Submission**: Submit technical event applications (Hackathons, Conferences, Workshops, Paper Presentations, Coding Contests, etc.) with host details, date ranges, number of OD days, academic justification, and supporting document links/files.
- **Workflow Tracking & Resubmissions**: Full multi-stage tracking (Submitted, Proctor Recommended, Admin Approved/Rejected). If returned for correction by a proctor or dean, students can edit event particulars, address reviewer feedback, and resubmit directly.

### 🧑‍🏫 2. Faculty Proctor Portal (`/proctor/login` & `/proctor`)
- **Assigned Cohort Isolation**: Proctors can view and interact with **only** the students assigned to them (e.g., Prof. Rajesh Sharma oversees students `23CS001`–`23CS018`; Prof. Mei Chen oversees students `23CS019`–`23CS036`).
- **Academic Eligibility Verification**: Detailed inspection of student attendance percentages, class counts, and freshness prior to taking action.
- **Advisory Recommendations**:
  - *Recommend Approval* (with mandatory remarks).
  - *Recommend Rejection* (with mandatory remarks).
  - *Return for Correction* (with remarks specifying what the student must fix).
- **Advisory Scope**: Proctors submit recommendations; final legal binding orders are reserved for the Dean/Administrator.

### 🏛️ 3. Administrator / Dean Portal (`/admin/login` & `/admin`)
- **Final Approval Authority**: Grants official approval, rejects requests (with mandatory formal reason), or returns applications for correction.
- **Authorized Attendance Overrides**: If a student is below the 75% threshold or has outdated/missing records, the system enforces a mandatory authorized Dean override rationale before approval can be granted.
- **Bulk Excel/CSV Attendance Upload**: Upload spreadsheet attendance data, preview parsed rows, run automatic formula calculations `(attended / conducted) * 100`, validate constraints (e.g. attended $\le$ conducted), and confirm import.
- **Policy Controls**: Configure the mandatory attendance threshold percentage (default: 75%) and data freshness limit (default: 30 days).
- **Cohort Management**: Reassign students between faculty proctors.
- **Audit Logging & CSV Exports**: Non-repudiable chronological audit trail and downloadable CSV reports for OD requests and attendance summaries.

---

## 2. Multi-Stage Approval Workflow

```
[Student Submits Request]
           │
           ▼
[Attendance Snapshot & Eligibility Flagged]
           │
           ▼
[Assigned Proctor Reviews & Recommends]
   ├── Recommend Approval (Remarks)
   ├── Recommend Rejection (Remarks)
   └── Return for Correction (Remarks) ──> [Student Edits & Resubmits]
           │
           ▼
[Dean / Administrator Issues Final Order]
   ├── Approve (Enforces Dean Override Reason if attendance < 75% or outdated)
   ├── Reject (Requires Formal Rejection Reason)
   └── Return for Correction ──> [Student Edits & Resubmits]
           │
           ▼
[Notification & Immutable Audit Log Generated]
```

---

## 3. Pre-Seeded Demonstration Accounts

For rapid evaluation and testing, Permitrix includes pre-configured university accounts:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Evelyn Vance | `admin@university.edu` | `admin123` | Dean of Academic Affairs & Chief Approval Officer |
| **Proctor** | Prof. Rajesh Sharma | `proctor.sharma@university.edu` | `proctor123` | CS Dept Proctor (Assigned to `23CS001` – `23CS018`) |
| **Proctor** | Prof. Mei Chen | `proctor.chen@university.edu` | `proctor123` | IT Dept Proctor (Assigned to `23CS019` – `23CS036`) |
| **Student** | Aarav Patel | `student.aarav.patel@university.edu` | `student123` | Roll: `23CS001` · 91.2% Attendance (Eligible) |
| **Student** | Vikram Malhotra | `student.vikram.malhotra@university.edu` | `student123` | Roll: `23CS005` · 71.4% Attendance (Shortage, <75%) |
| **Student** | Alisha D'Souza | `student.alisha.d.souza@university.edu` | `student123` | Roll: `23CS022` · 79.0% Attendance (Outdated, 48 days old) |
| **Student** | Varun Nambiar | `student.varun.nambiar@university.edu` | `student123` | Roll: `23CS023` · Missing Attendance Data |

*Tip: Click the "Demo Switcher" button in the top navigation to instantly log in as any persona with one click.*

---

## 4. Mobile & Touch Optimization

- **Responsive Viewport Layouts**: Full adaptability across smartphones (iPhone, Android 375px–430px), tablets, laptops, and large desktop monitors.
- **Collapsible Navigation**: Desktop navigation gracefully transitions to a collapsible slide-out hamburger menu with touch hitboxes $\ge 44\text{px}$.
- **Adaptive Data Cards**: Wide horizontal data tables automatically transform into stacked, readable card components on small screens.
- **Responsive Charts**: SVG progress meters and distribution bars scale fluidly without clipping.
- **Ergonomic Form Controls**: Native date pickers, accessible select elements, and touch-friendly confirmation dialogs.

---

## 5. Setup & Local Development Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express API + Vite SPA)
npm run dev
```

The application runs on `http://localhost:3000`.

### Production Build & Deployment

```bash
# 1. Build the production bundle
npm run build

# 2. Start production server
npm start
```

---

## 6. Environment Variables

Define the following in your environment or `.env`:

```env
# Port on which Express and Vite middleware listen
PORT=3000

# Node environment mode
NODE_ENV=development
```

---

## 7. Database Persistence

Data is stored in `server/data/permitrix_db.json`. When the application initializes for the first time, it automatically verifies that at least 36 students and 12 sample requests across all workflow statuses are seeded. Any updates (new requests, CSV imports, proctor reviews, administrator decisions, setting changes) persist directly to disk.
