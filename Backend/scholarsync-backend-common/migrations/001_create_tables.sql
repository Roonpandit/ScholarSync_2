-- ScholarSync Database Schema
-- Run this in Supabase SQL Editor

-- Drop existing tables if any (careful in production!)
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS leave_slots CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS attendance_slots CASCADE;
DROP TABLE IF EXISTS allowed_ips CASCADE;
DROP TABLE IF EXISTS ip_settings CASCADE;
DROP TABLE IF EXISTS lectures CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop existing ENUMs
DROP TYPE IF EXISTS enum_students_role CASCADE;
DROP TYPE IF EXISTS enum_teachers_role CASCADE;
DROP TYPE IF EXISTS enum_admins_role CASCADE;
DROP TYPE IF EXISTS enum_attendance_shift CASCADE;
DROP TYPE IF EXISTS enum_attendance_status CASCADE;
DROP TYPE IF EXISTS enum_attendance_slots_shift CASCADE;
DROP TYPE IF EXISTS enum_attendance_slots_status CASCADE;
DROP TYPE IF EXISTS enum_leave_requests_leave_type CASCADE;
DROP TYPE IF EXISTS enum_leave_requests_status CASCADE;
DROP TYPE IF EXISTS enum_leave_slots_status CASCADE;

-- ========== ENUM TYPES ==========

CREATE TYPE enum_students_role AS ENUM ('student');
CREATE TYPE enum_teachers_role AS ENUM ('teacher');
CREATE TYPE enum_admins_role AS ENUM ('admin');
CREATE TYPE enum_attendance_shift AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE enum_attendance_status AS ENUM ('pending', 'awaiting_approval', 'present', 'absent', 'on_leave');
CREATE TYPE enum_attendance_slots_shift AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE enum_attendance_slots_status AS ENUM ('upcoming', 'active', 'closed');
CREATE TYPE enum_leave_requests_leave_type AS ENUM ('sick', 'other');
CREATE TYPE enum_leave_requests_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'closed');
CREATE TYPE enum_leave_slots_status AS ENUM ('blocked', 'on_leave', 'cancelled');

-- ========== STUDENTS ==========

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    student_code VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(10),
    password VARCHAR(255) NOT NULL,
    role enum_students_role NOT NULL DEFAULT 'student',
    lectures UUID[] NOT NULL DEFAULT '{}',
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_role ON students(role);

-- ========== TEACHERS ==========

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    teacher_code VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(10),
    password VARCHAR(255) NOT NULL,
    role enum_teachers_role NOT NULL DEFAULT 'teacher',
    lectures UUID[] DEFAULT '{}',
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_teacher_code ON teachers(teacher_code);

-- ========== ADMINS ==========

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role enum_admins_role NOT NULL DEFAULT 'admin',
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admins_email ON admins(email);

-- ========== LECTURES ==========

CREATE TABLE lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    lecture_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    is_default BOOLEAN NOT NULL DEFAULT false,
    description TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lectures_lecture_id ON lectures(lecture_id);
CREATE INDEX idx_lectures_is_default ON lectures(is_default);
CREATE INDEX idx_lectures_is_active ON lectures(is_active);

-- ========== ATTENDANCE SLOTS ==========

CREATE TABLE attendance_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift enum_attendance_slots_shift NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status enum_attendance_slots_status NOT NULL DEFAULT 'upcoming',
    is_active BOOLEAN NOT NULL DEFAULT true,
    lecture UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    notified BOOLEAN NOT NULL DEFAULT false,
    notification_sent_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_slots_date_shift ON attendance_slots(date, shift);
CREATE INDEX idx_attendance_slots_is_active ON attendance_slots(is_active);
CREATE INDEX idx_attendance_slots_lecture ON attendance_slots(lecture);
CREATE INDEX idx_attendance_slots_lecture_status ON attendance_slots(lecture, status);

-- ========== ATTENDANCE ==========

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    slot UUID NOT NULL REFERENCES attendance_slots(id) ON DELETE CASCADE,
    lecture UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    shift enum_attendance_shift NOT NULL,
    status enum_attendance_status NOT NULL DEFAULT 'pending',
    leave_request_id UUID,
    photo JSONB,
    location JSONB,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    student_code VARCHAR(100) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    status_updated_by UUID,
    remark VARCHAR(1000),
    status_updated_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student, slot)
);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_slot ON attendance(slot);
CREATE INDEX idx_attendance_lecture ON attendance(lecture);
CREATE INDEX idx_attendance_student_code ON attendance(student_code);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_slot_status ON attendance(slot, status);
CREATE INDEX idx_attendance_status_updated_by ON attendance(status_updated_by);

-- ========== LEAVE REQUESTS ==========

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    leave_type enum_leave_requests_leave_type NOT NULL,
    from_date TIMESTAMPTZ NOT NULL,
    to_date TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    status enum_leave_requests_status NOT NULL DEFAULT 'pending',
    teacher_remark TEXT,
    student_remark TEXT,
    rejected_at TIMESTAMPTZ,
    reject_expires_at TIMESTAMPTZ,
    resend_count INTEGER NOT NULL DEFAULT 0,
    is_resent BOOLEAN NOT NULL DEFAULT false,
    parent_request_id UUID REFERENCES leave_requests(id),
    approved_at TIMESTAMPTZ,
    responded_by UUID REFERENCES teachers(id),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    is_cancelled BOOLEAN NOT NULL DEFAULT false,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_student_status ON leave_requests(student_id, status);
CREATE INDEX idx_leave_requests_teacher_status ON leave_requests(teacher_id, status);
CREATE INDEX idx_leave_requests_lecture_dates ON leave_requests(lecture_id, from_date, to_date);
CREATE INDEX idx_leave_requests_status_expires ON leave_requests(status, reject_expires_at);
CREATE INDEX idx_leave_requests_dates ON leave_requests(from_date, to_date);

-- ========== LEAVE SLOTS ==========

CREATE TABLE leave_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    attendance_slot_id UUID NOT NULL REFERENCES attendance_slots(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    status enum_leave_slots_status NOT NULL DEFAULT 'blocked',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attendance_slot_id, student_id)
);

CREATE INDEX idx_leave_slots_student_lecture_date ON leave_slots(student_id, lecture_id, date);
CREATE INDEX idx_leave_slots_leave_request ON leave_slots(leave_request_id);
CREATE INDEX idx_leave_slots_status ON leave_slots(status);

-- ========== ALLOWED IPS ==========

CREATE TABLE allowed_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    location_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    added_by UUID,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_allowed_ips_ip_address ON allowed_ips(ip_address);

-- ========== IP SETTINGS ==========

CREATE TABLE ip_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_by_admin UUID,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== REFRESH TOKENS ==========

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
