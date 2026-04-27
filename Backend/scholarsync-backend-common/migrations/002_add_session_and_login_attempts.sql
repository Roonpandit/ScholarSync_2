-- Add session_id to user tables
ALTER TABLE students ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS session_id UUID;

-- Login attempts table for brute force protection
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    success BOOLEAN NOT NULL DEFAULT false,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, attempted_at);
