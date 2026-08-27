# ScholarSync — Product & Technical Documentation

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Backend APIs](#backend-apis)
- [Frontend Routes](#frontend-routes)
- [Business Features](#business-features)
- [System Features](#system-features)
- [Feature Enhancement Tracker](#feature-enhancement-tracker)

---

## Architecture Overview

| Component | Tech Stack | Port |
|---|----|---|
| **IAM Service** | Node.js, Express, Sequelize, PostgreSQL (Supabase) | 5001 |
| **WFMS Service** | Node.js, Express, Sequelize, PostgreSQL (Supabase) | 5002 |
| **Notification Service** | Node.js, Express, Gmail OAuth2, node-cron | 5003 |
| **Report Service** | Node.js, Express, Sequelize, PostgreSQL (Supabase) | 5004 |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS | 5173 |
| **Database** | PostgreSQL (Supabase) | — |
| **File Storage** | Cloudinary | — |

---

## Backend APIs (57 total)

### IAM Service — 18 APIs (`/api/iam/v1`)

| # | Feature | Method | Endpoint | Auth | Merged From |
|---|---|---|---|---|---|
| 1 | Login (all roles) | POST | `/auth/login` | Public | — |
| 2 | Seed admin | POST | `/auth/seed-admin` | Public | — |
| 3 | Forgot password | POST | `/auth/forgot-password` | Public | — |
| 4 | Reset password | PUT | `/auth/reset-password/:token` | Public | — |
| 5 | Refresh token | POST | `/auth/refresh-token` | Public | NEW |
| 6 | Get profile | GET | `/auth/me` | All | — |
| 7 | Change password | PUT | `/auth/update-password` | All | — |
| 8 | Register student/teacher | POST | `/auth/register` | Admin/Teacher | Merged: createStudent + createTeacher |
| 9 | Bulk register | POST | `/auth/bulk/register` | Admin/Teacher | Merged: createStudentsBulk |
| 10 | Get user | GET | `/users/:id` | Admin | Merged: getStudent + getTeacher |
| 11 | Update user | PUT | `/users/:id` | Admin/Teacher | Merged: updateStudent + updateTeacher |
| 12 | Delete user | DELETE | `/users/:id` | Admin | Merged: deleteStudent + deleteTeacher |
| 13 | List teachers | GET | `/teachers` | Admin | — |
| 14 | List students | GET | `/students?lectureId=` | Admin/Teacher | Merged: getAllStudents + getStudentsByClass |
| 15 | Manage lectures | POST | `/lectures/manage` | Admin | Merged: assign + unassign + addLectures |
| 16 | Manage IP | POST | `/ip/manage` | Admin | Merged: addIP + toggleIPRestriction |
| 17 | Delete IP | DELETE | `/ip/:id` | Admin | — |
| 18 | IP status | GET | `/ip/status` | Admin | Merged: getAllowedIPs + getIPRestrictionStatus |

### WFMS Service — 31 APIs (`/api/wfms/v1`)

| # | Feature | Method | Endpoint | Auth |
|---|---|---|---|---|
| 1 | Create attendance slot | POST | `/attendance-slots` | Admin/Teacher |
| 2 | List attendance slots | GET | `/attendance-slots` | Admin/Teacher |
| 3 | Close attendance slot | PUT | `/attendance-slots/:id/close` | Admin/Teacher |
| 4 | Delete attendance slot | DELETE | `/attendance-slots/:id` | Admin |
| 5 | Student active slots | GET | `/student/attendance-slots` | Student |
| 6 | Student mark attendance | POST | `/student/attendance` | Student (multer) |
| 7 | Attendance history | GET | `/student/attendance?type=` | Student |
| 8 | Attendance counts | GET | `/student/attendance-counts` | All |
| 9 | List attendance by slot | GET | `/attendance` | Admin/Teacher |
| 10 | Admin mark attendance | POST | `/attendance/mark` | Admin/Teacher |
| 11 | Absent students list | GET | `/attendance/absent` | Admin/Teacher |
| 12 | Attendance details | GET | `/attendance/details` | Admin/Teacher |
| 13 | Mark absent | POST | `/attendance/:id/mark-absent` | Admin/Teacher |
| 14 | Approve/reject attendance | POST | `/attendance/:id/status` | Admin/Teacher |
| 15 | Attendance stats | GET | `/attendance/stats` | Admin/Teacher |
| 16 | Apply leave | POST | `/leave/apply` | Student |
| 17 | My leave requests | GET | `/leave/my-requests` | Student |
| 18 | Check leave for slot | GET | `/leave/check-slot` | All |
| 19 | Leave details | GET | `/leave/details/:id` | All |
| 20 | Get leave request | GET | `/leave/:requestId` | All |
| 21 | Delete leave | DELETE | `/leave/:requestId` | Student |
| 22 | Manage leave | POST | `/leave/:requestId/manage` | All |
| 23 | List leaves | GET | `/leave?status=` | Admin/Teacher |
| 24 | List lectures | GET | `/lectures?filter=` | All |
| 25 | Get lecture | GET | `/lectures/:id` | Admin |
| 26 | Lecture students | GET | `/lectures/:id/students` | Admin |
| 27 | Lecture teacher | GET | `/lectures/:lectureId/teacher` | Student |
| 28 | Create lecture | POST | `/lectures` | Admin |
| 29 | Update lecture | PUT | `/lectures/:id` | Admin |
| 30 | Delete lecture | DELETE | `/lectures/:id` | Admin |

### Notification Service — 5 APIs (`/api/notification/v1`)

| # | Feature | Method | Endpoint | Auth |
|---|---|---|---|---|
| 1 | Welcome email | POST | `/welcome-email` | Internal |
| 2 | Password reset email | POST | `/password-reset-email` | Internal |
| 3 | Reset confirmation | POST | `/password-reset-confirmation` | Internal |
| 4 | Absent notification | POST | `/absent-notification` | Internal |
| 5 | Feedback emails | POST | `/feedback-emails` | Admin/Teacher |

### Report Service — 4 APIs (`/api/report/v1`)

| # | Feature | Method | Endpoint | Auth |
|---|---|---|---|---|
| 1 | Student details + counts | GET | `/students/:id/details` | Admin/Teacher |
| 2 | Attendance details | GET | `/attendance/details` | Admin/Teacher |
| 3 | Attendance stats | GET | `/attendance/stats` | Admin/Teacher |
| 4 | Leave stats | GET | `/leave/stats` | Admin |

---

## Frontend Routes (20 pages)

| # | Route | Page | Access |
|---|---|---|---|
| 1 | `/home` | Landing | Public |
| 2 | `/login` | Login | Public |
| 3 | `/reset-password/:token` | Reset Password | Public |
| 4 | `/documentation` | User Guide | Public |
| 5 | `/documentation/teachers` | Teachers Guide | Public |
| 6 | `/documentation/students` | Students Guide | Public |
| 7 | `/dashboard` | Dashboard | Admin/Teacher |
| 8 | `/students` | Student Management | Admin/Teacher |
| 9 | `/students/:id` | Student Details | Admin/Teacher |
| 10 | `/attendance-slots` | Attendance Slots | Admin/Teacher |
| 11 | `/attendance/stats` | Attendance Stats | Admin/Teacher |
| 12 | `/leave-management` | Leave Management | Admin/Teacher |
| 13 | `/reviews` | Feedback/Reviews | Admin/Teacher |
| 14 | `/teachers` | Teacher Management | Admin |
| 15 | `/lecture-management` | Lecture Management | Admin |
| 16 | `/ip-management` | IP Management | Admin |
| 17 | `/student/dashboard` | Student Dashboard | Student |
| 18 | `/student/mark-attendance` | Mark Attendance | Student |
| 19 | `/student/attendance` | Attendance History | Student |
| 20 | `/student/leave` | Leave Management | Student |

---

## Business Features

### Admin Features (25)

| # | Feature | Description | Status |
|---|---|---|---|
| 1 | Seed Admin Account | First-time setup — creates admin account using env credentials | Done |
| 2 | Login | Email + password, access token (15min) + refresh token (2hr) | Done |
| 3 | Register Student | Create student with name, email, code, password, phone, lectures. Auto welcome email | Done |
| 4 | Register Teacher | Create teacher with name, email, code, password, phone, lectures. Auto welcome email | Done |
| 5 | Bulk Register Students | CSV/Excel upload — validates, skips duplicates, sends welcome emails | Done |
| 6 | View All Students | List all students, filter by lecture | Done |
| 7 | View All Teachers | List all teachers | Done |
| 8 | View/Edit Any User | View/edit student or teacher profile (name, email, code, phone, lectures) | Done |
| 9 | Delete Any User | Delete student (cleanup attendance + Cloudinary photos) or teacher | Done |
| 10 | Assign/Unassign Lectures | Bulk assign or remove lectures from multiple students | Done |
| 11 | Create Lectures | Create lecture (first becomes default — all students must belong) | Done |
| 12 | Edit/Delete Lectures | Rename, deactivate, delete (cascade deletes attendance + photos) | Done |
| 13 | Create Attendance Slots | Set date, shift, time range, lectures. Creates pending attendance for enrolled students | Done |
| 14 | View Attendance | See present/absent per slot, view photos, locations | Done |
| 15 | Approve/Reject Attendance | Review selfie + location, approve or reject with remark | Done |
| 16 | Mark Absent | Manually mark absent with remark (sends notification email) | Done |
| 17 | Close/Delete Slots | Close active slot or delete (removes attendance records + photos) | Done |
| 18 | Attendance Statistics | Monthly/date range stats, per-student absence count, min absences filter | Done |
| 19 | Student Details Report | Full profile + attendance history with date filters | Done |
| 20 | Leave Management | View all leave requests, filter by status, approve/reject with remark | Done |
| 21 | Leave Statistics | Leave counts by status and type | Done |
| 22 | IP Restriction | Add allowed IPs, enable/disable — students login only from allowed IPs | Done |
| 23 | Send Feedback Emails | Select students, send feedback form link via email | Done |
| 24 | Export Attendance | Download Excel with color-coded absent rows | Done |
| 25 | Password Management | Change own password, forgot password via email | Done |

### Teacher Features (16)

| # | Feature | Description | Status |
|---|---|---|---|
| 1 | Login | Same as admin — access + refresh tokens | Done |
| 2 | Dashboard | Own student count, active slots, recent attendance | Done |
| 3 | View Students | Only students in teacher's lectures | Done |
| 4 | Add Student | Create student — restricted to teacher's own lectures | Done |
| 5 | Bulk Upload Students | CSV upload — restricted to own lectures | Done |
| 6 | Edit Student | Name and phone only (not email, code, or lectures) | Done |
| 7 | View Student Details | Profile + attendance history | Done |
| 8 | Create Attendance Slots | Own lectures only (not default lecture) | Done |
| 9 | View/Approve/Reject Attendance | Review, approve selfies, reject with remark | Done |
| 10 | Mark Absent | Same as admin | Done |
| 11 | Attendance Statistics | Scoped to teacher's lectures | Done |
| 12 | Leave Management | Pending/all for own lectures, approve/reject | Done |
| 13 | Send Feedback Emails | Same as admin | Done |
| 14 | Export Attendance | Same Excel export | Done |
| 15 | Password Management | Change own password | Done |
| 16 | Cannot Delete | DELETE operations blocked by middleware | Done |

### Student Features (12)

| # | Feature | Description | Status |
|---|---|---|---|
| 1 | Login | Email + password, IP restriction check (if enabled) | Done |
| 2 | Dashboard | Attendance stats, active slots, quick actions | Done |
| 3 | Mark Attendance | Camera + face detection (BlazeFace) + GPS + selfie + time window | Done |
| 4 | Attendance History | Tabs: All/Present/Absent/Pending, monthly filters, view photos | Done |
| 5 | Apply Leave | Lecture-teacher pair, type (sick: max 2d, other: 3d advance), reason | Done |
| 6 | View Leave Requests | All requests with status filter | Done |
| 7 | Delete Leave | Pending requests only | Done |
| 8 | Resend Leave | Rejected → resend within 48hr, max 1 resend | Done |
| 9 | Cancel Leave | Cancel approved leave, future slots released | Done |
| 10 | View Leave Details | Full info with teacher remarks, status timeline | Done |
| 11 | Password Management | Change own password | Done |
| 12 | IP Session Lock | IP locked to login IP — changing IP forces re-login | Done |

### System Features (9)

| # | Feature | Description | Status |
|---|---|---|---|
| 1 | Slot Status Auto-Update | Cron (every second) — upcoming → active → closed | Done |
| 2 | Auto Mark Absent | Cron (every minute) — pending → absent when slot closes | Done |
| 3 | Auto-Close Expired Leave | Cron (hourly) — closes rejected leave after 48hr | Done |
| 4 | Attendance Reminders | Cron (every minute) — email 15min before slot starts | Done |
| 5 | Welcome Emails | Auto-sent on student/teacher creation | Done |
| 6 | Password Reset Emails | Forgot password flow, token expires in 10min | Done |
| 7 | Absent Notification Emails | Sent when admin/teacher marks absent | Done |
| 8 | Refresh Token | Access (15min) auto-refreshes via refresh token (2hr) in PostgreSQL | Done |
| 9 | PWA | Installable on mobile, offline cached pages | Done |

---

## Feature Enhancement Tracker

### Legend
- [ ] Not started
- [x] Completed
- [~] In discussion

---

### #1 — Seed Admin Account

**Current:** Public API, env-based credentials, single admin only.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| — | No enhancements planned | Keep as-is | [x] |

---

### #2 — Login

**Current:** Email + password, access + refresh tokens, no rate limiting.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 2.1 | Single session (new login kills old) | YES — sessionId in JWT + DB, validated on each request | [x] |
| 2.2 | Progressive lockout (5→15min, 10→1hr, 15→6hr, 20→disable) | YES — tiered lockout, auto-disable at 20 failures | [x] |
| 2.7 | Block/unblock user API | YES — POST `/users/:id/block` + `/unblock` (admin only) | [x] |
| 2.8 | User status field (Active/Disabled) | YES — middleware blocks disabled users | [x] |
| 2.3 | Remember Me | REMOVED — checkbox removed from Login.tsx | [x] |
| 2.4 | Login returns user data + tokens in one call | NO — keep 2 calls (login + /me) | [x] |
| 2.5 | OAuth/SSO (Google, Facebook) | REMOVED — buttons + signup link + auth popup removed from Login.tsx | [x] |
| 2.6 | IP restriction for teachers | NO — students only for now | [x] |

---

### #3 — Forgot / Reset Password

**Current:** Email-based reset, 10min token expiry, confirmation email sent.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 3.1 | Rate limit (3 requests/hour) | YES — counts from activity_logs | [x] |
| 3.2 | Token expiry 10 min | Keep as-is | [x] |
| 3.3 | Confirmation email after reset | Already implemented | [x] |
| 3.4 | Invalidate old tokens on new request + after reset | YES — clears token before generating new | [x] |
| 3.5 | Kill all sessions on password reset | YES — clears sessionId, all devices logged out | [x] |
| 3.6 | Block reset for disabled accounts | YES — returns error 1027 | [x] |
| 3.7 | Log password resets in activity_logs | YES — logs 'password_reset_request' + 'password_reset_complete' | [x] |
| 3.8 | Renamed LoginAttempt → ActivityLog | YES — single table for all audit logs with `type` column | [x] |

### #4 — Refresh Token

**Current:** 15min access + 2hr refresh, stored in PostgreSQL, auto-refresh via axios interceptor.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 4.1 | Refresh token rotation | NO — keep same token until expiry | [x] |
| 4.2 | Revoke on logout (backend API) | YES — POST `/auth/logout` deletes refresh token + clears sessionId | [x] |
| 4.3 | Multiple device support | NO — single device (sessionId enforced) | [x] |
| 4.4 | Token expiry | Keep as-is (15min access, 2hr refresh) | [x] |
| 4.5 | Log refresh activity | NO — skip | [x] |

### #5 — Get Profile

**Current:** Returns name, email, role, phone, studentCode/teacherCode.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 5.1 | Profile picture | NO — not using currently | [x] |
| 5.2 | Last login timestamp | YES — pulled from activity_logs | [x] |
| 5.3 | Additional fields (DOB, address) | NO | [x] |
| 5.4 | Self-profile update | NO — admin updates via /users/:id | [x] |

### #6 — Change Password

**Current:** Validates current + new password, checks not same, updates.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 6.1 | Kill all sessions after change | YES — clears sessionId + deletes refresh token, forces re-login | [x] |
| 6.2 | Log password change | YES — logs `password_change` in activity_logs | [x] |
| 6.3 | Email notification | YES — sends confirmation email via notification service | [x] |
| 6.4 | Success message | Updated — "Password changed successfully. Please login again." | [x] |

### #7 — Register Student/Teacher

**Current:** Admin/Teacher creates user with role, name, email, code, password, phone, lectures.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 7.1 | Force password change on first login | YES — `mustChangePassword` flag, cleared after first password change | [x] |
| 7.2 | Email lowercase enforcement | YES — Joi `.lowercase()` on all email fields | [x] |
| 7.3 | Unified duplicate check (email, phone, code) | YES — `checkDuplicateFields()` checks across all tables, error 1039 `$fieldName$ already exists` | [x] |
| 7.4 | getCatchErrorMessage helper | YES — logs errors + returns structured response | [x] |
| 7.5 | No password in registration | YES — removed password field, auto-generates temp password, sends "Set Password" link via welcome email | [x] |
| 7.6 | Reset token on creation | YES — 24hr expiry for first-time setup (vs 10min for forgot password) | [x] |

### #8 — Bulk Register

**Current:** CSV/Excel upload, validates rows, skips duplicates, sends welcome emails.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 8.1 | Batch size limit (50) | YES — error 1040 if exceeded | [x] |
| 8.2 | Per-row duplicate check (email, phone, code) | YES — checks within batch + against DB | [x] |
| 8.3 | Per-row detailed errors | YES — returns `{ row, field, message }` for each failed row | [x] |
| 8.4 | Same validations as single register | YES — lowercase email, phone check, mustChangePassword from model default | [x] |
| 8.5 | No password in bulk register | YES — auto-generates temp password per student, sends "Set Password" link | [x] |

### #9 — User Management (Get/Update/Delete/Block/Unblock)

**Current:** Unified CRUD by ID, auto-detect role, block/unblock with action.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 9.1 | DeletionLog table | YES — logs deleted user data (JSONB) before hard delete | [x] |
| 9.2 | UpdateHistory table | YES — logs original + edit data on every update/status change | [x] |
| 9.3 | Prevent self-delete | YES — error 1041 | [x] |
| 9.4 | Prevent self-block | YES — error 1042 | [x] |
| 9.5 | Log block/unblock in UpdateHistory | YES — action_type `changeStatus`, before/after status | [x] |
| 9.6 | Log user updates in UpdateHistory | YES — action_type `updateData`, original + edit JSONB | [x] |

### #10 — Lecture Assignment

**Current:** Assign/unassign lectures to students via action.

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 10.1 | Org filter — only same-org lectures/students | YES — orgId enforced | [x] |
| 10.2 | Admin + Teacher can assign (teacher restricted to own lectures) | YES | [x] |
| 10.3 | Bulk limit same as BULK_REGISTER_LIMIT (50) | YES | [x] |
| 10.4 | Log in UpdateHistory | NO — skip | [x] |

### #11 — IP Management

**Current:** Add/toggle/delete IPs, per-IP enabled/disabled, applies_to (student/teacher/both).

| # | Enhancement | Decision | Status |
|---|---|---|---|
| 11.1 | Org-scoped — each org has own IP whitelist | YES — orgId in allowed_ips | [x] |
| 11.2 | Per-IP `appliesTo` (student/teacher/both) | YES — enum column | [x] |
| 11.3 | Per-IP `isEnabled` toggle | YES — enable/disable without deleting | [x] |
| 11.4 | Removed IPSettings table | YES — toggle is per-IP, no global switch | [x] |
| 11.5 | Removed ip_restriction_enabled from global_settings | YES | [x] |
| 11.6 | Middleware IP check for students AND teachers | YES — checks based on role + appliesTo | [x] |
| 11.7 | Kill session on IP violation | YES — clears sessionId + deletes refresh token | [x] |
| 11.8 | Using request-ip package | YES — like eSign | [x] |
| 11.9 | REGEX_PATTERNS in common | YES — UUID, MOBILE, IPV4, PASSWORD, etc. | [x] |

### #12 — Attendance Slots
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #13 — Mark Attendance (Student)
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #14 — Approve/Reject Attendance
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #15 — Leave Workflow
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #16 — IP Restriction
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #17 — Notifications / Emails
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #18 — Reports & Analytics
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #19 — System / Cron Jobs
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

### #20 — PWA / Frontend
| # | Enhancement | Decision | Status |
|---|---|---|---|
| | *(To be discussed)* | | [ ] |

---

*Last updated: 2026-04-18*
*Generated with Claude Code*
