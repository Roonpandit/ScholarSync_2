ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active';

CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
