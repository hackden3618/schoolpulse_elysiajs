-- SchoolPulse v1.1.0 target PostgreSQL schema
-- Status: engineering baseline for Prisma/migration implementation
-- Notes:
--   1. Money uses numeric(12,2), never floating point.
--   2. All tenant-owned tables include school_id directly unless explicitly global.
--   3. Confirmed finance records are immutable by application rule; corrections use reversals.
--   4. Soft deletes use deleted_at.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE school_tier AS ENUM ('small', 'medium', 'large', 'enterprise');
CREATE TYPE school_level AS ENUM ('pre_primary', 'primary', 'junior_secondary', 'senior_secondary', 'mixed');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'suspended', 'pending_review', 'defaulted', 'terminated');
CREATE TYPE subscription_plan AS ENUM ('free', 'monthly', 'termly', 'yearly', 'enterprise');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE membership_status AS ENUM ('active', 'on_leave', 'suspended', 'resigned', 'terminated');
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'archived', 'graduated', 'deceased');
CREATE TYPE archive_reason AS ENUM ('graduated', 'dropped_out', 'expelled', 'transferred', 'deceased', 'other');
CREATE TYPE relationship AS ENUM ('father', 'mother', 'sibling', 'emergency', 'sponsor', 'legal_guardian', 'step_parent', 'relative', 'other');
CREATE TYPE enrollment_status AS ENUM ('active', 'suspended', 'transferred', 'expelled', 'on_leave', 'medical_leave', 'truant', 'dropped_out', 'graduated');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE performance_expectation AS ENUM ('below_expectation', 'average', 'good', 'excellent', 'exceptional');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE attendance_session_type AS ENUM ('morning', 'afternoon', 'lesson');
CREATE TYPE exam_type AS ENUM ('cat', 'midterm', 'endterm', 'mock', 'opener', 'continuous_assessment', 'practical', 'project', 'oral', 'national', 'custom');
CREATE TYPE assessment_performance AS ENUM ('excellent', 'good', 'average', 'below_average', 'poor');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'written_off');
CREATE TYPE payment_method AS ENUM ('mpesa_stk', 'mpesa_c2b', 'bank_transfer', 'bursary', 'cash', 'adjustment', 'credit');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'reversed');
CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'announcement');
CREATE TYPE message_channel AS ENUM ('in_app', 'sms', 'whatsapp', 'email');
CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE message_type AS ENUM ('text', 'announcement', 'invoice', 'payment', 'attendance', 'assessment', 'system');
CREATE TYPE receipt_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE event_status AS ENUM ('pending', 'processing', 'processed', 'failed', 'dead_letter');
CREATE TYPE aggregate_type AS ENUM ('school', 'user', 'membership', 'student', 'academic_year', 'term', 'class_instance', 'attendance_session', 'exam', 'invoice', 'payment', 'conversation', 'subscription');
CREATE TYPE event_type AS ENUM (
  'SchoolCreated',
  'UserCreated',
  'MembershipCreated',
  'RoleAssigned',
  'StudentAdmitted',
  'GuardianAdded',
  'StudentTransferred',
  'StudentArchived',
  'AcademicYearActivated',
  'TermActivated',
  'TeacherAssigned',
  'AttendanceMarked',
  'AttendanceEdited',
  'InvoiceGenerated',
  'PaymentReceived',
  'PaymentReversed',
  'FeeReminderQueued',
  'ExamCreated',
  'AssessmentPublished',
  'ConversationCreated',
  'MessageSent',
  'SubscriptionExpired'
);

CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code text NOT NULL UNIQUE,
  school_name text NOT NULL UNIQUE,
  school_phone text NOT NULL UNIQUE,
  school_email text UNIQUE,
  school_website text,
  school_address text,
  school_logo text,
  post_office text,
  county text NOT NULL,
  town text NOT NULL,
  country text NOT NULL DEFAULT 'Kenya',
  currency text NOT NULL DEFAULT 'KES',
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  school_tier school_tier NOT NULL DEFAULT 'medium',
  school_level school_level NOT NULL DEFAULT 'mixed',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  second_name text,
  last_name text,
  phone text NOT NULL UNIQUE,
  email text UNIQUE,
  hashed_password text,
  profile_pic text,
  status user_status NOT NULL DEFAULT 'active',
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status membership_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (school_id, user_id)
);

CREATE TABLE school_membership_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES school_memberships(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membership_id, role_id)
);

CREATE TABLE academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (school_id, name),
  CHECK (start_date < end_date)
);

CREATE UNIQUE INDEX one_active_academic_year_per_school
  ON academic_years (school_id)
  WHERE active = true AND deleted_at IS NULL;

CREATE TABLE terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (academic_year_id, name),
  CHECK (start_date < end_date)
);

CREATE UNIQUE INDEX one_active_term_per_academic_year
  ON terms (academic_year_id)
  WHERE active = true AND deleted_at IS NULL;

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  level integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (school_id, name)
);

CREATE TABLE class_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  stream_name text NOT NULL,
  class_teacher_membership_id uuid REFERENCES school_memberships(id),
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (class_id, academic_year_id, stream_name)
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_number text NOT NULL,
  first_name text NOT NULL,
  second_name text,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender gender,
  admission_date timestamptz NOT NULL DEFAULT now(),
  status student_status NOT NULL DEFAULT 'active',
  archive_reason archive_reason,
  performance_expectation performance_expectation,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (school_id, admission_number)
);

CREATE INDEX idx_students_school_status ON students (school_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_name_search ON students USING gin (to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(second_name,'') || ' ' || coalesce(last_name,'')));

CREATE TABLE student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship relationship NOT NULL DEFAULT 'legal_guardian',
  is_primary boolean NOT NULL DEFAULT false,
  can_pay boolean NOT NULL DEFAULT true,
  receives_sms boolean NOT NULL DEFAULT true,
  receives_email boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (student_id, guardian_id)
);

CREATE UNIQUE INDEX one_primary_guardian_per_student
  ON student_guardians (student_id)
  WHERE is_primary = true AND deleted_at IS NULL;

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_instance_id uuid NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id uuid REFERENCES terms(id) ON DELETE SET NULL,
  status enrollment_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (student_id, class_instance_id, academic_year_id)
);

CREATE INDEX idx_enrollments_school_status ON enrollments (school_id, status) WHERE deleted_at IS NULL;

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  is_compulsory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (school_id, code)
);

CREATE TABLE class_subject_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_instance_id uuid NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_membership_id uuid REFERENCES school_memberships(id),
  assignment_type text NOT NULL DEFAULT 'main',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (class_instance_id, subject_id)
);

CREATE TABLE attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_instance_id uuid NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  marker_membership_id uuid REFERENCES school_memberships(id),
  session_date date NOT NULL,
  session_type attendance_session_type NOT NULL DEFAULT 'morning',
  status text NOT NULL DEFAULT 'open',
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (class_instance_id, session_date, session_type)
);

CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  check_in_time timestamptz,
  edit_reason text,
  edited_by_membership_id uuid REFERENCES school_memberships(id),
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (session_id, student_id)
);

CREATE TABLE exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  name text NOT NULL,
  type exam_type NOT NULL DEFAULT 'custom',
  start_date date NOT NULL,
  end_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (school_id, term_id, name),
  CHECK (start_date <= end_date)
);

CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  class_instance_id uuid NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  total_marks numeric(6,2) NOT NULL,
  accounted_in_final boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (exam_id, class_instance_id, subject_id),
  CHECK (total_marks > 0)
);

CREATE TABLE assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  attained_marks numeric(6,2) NOT NULL,
  performance assessment_performance,
  remarks text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (assessment_id, student_id),
  CHECK (attained_marks >= 0)
);

CREATE TABLE fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  is_global boolean NOT NULL DEFAULT false,
  is_latest boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  optional boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (amount >= 0)
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  fee_structure_id uuid REFERENCES fee_structures(id) ON DELETE SET NULL,
  total_amount numeric(12,2) NOT NULL,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  balance numeric(12,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'issued',
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (total_amount >= 0),
  CHECK (paid_amount >= 0),
  CHECK (balance >= 0)
);

CREATE UNIQUE INDEX one_current_invoice_per_student_term
  ON invoices (school_id, student_id, term_id)
  WHERE is_current = true AND deleted_at IS NULL;

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  provider text,
  transaction_ref text NOT NULL,
  amount numeric(12,2) NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  reversed_payment_id uuid REFERENCES payments(id),
  created_by_membership_id uuid REFERENCES school_memberships(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount > 0)
);

CREATE UNIQUE INDEX unique_payment_ref_per_school
  ON payments (school_id, provider, transaction_ref)
  WHERE status <> 'failed';

CREATE TABLE payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount > 0)
);

CREATE TABLE financial_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  actor_membership_id uuid REFERENCES school_memberships(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  action_description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type conversation_type NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES school_memberships(id) ON DELETE SET NULL,
  participant_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  sender_membership_id uuid REFERENCES school_memberships(id) ON DELETE SET NULL,
  recipient_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  channel message_channel NOT NULL DEFAULT 'in_app',
  message_type message_type NOT NULL DEFAULT 'text',
  priority message_priority NOT NULL DEFAULT 'normal',
  subject text,
  content text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_latest boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE message_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status receipt_status NOT NULL DEFAULT 'pending',
  channel message_channel NOT NULL,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_membership_id uuid REFERENCES school_memberships(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  aggregate_id uuid NOT NULL,
  aggregate_type aggregate_type NOT NULL,
  event_type event_type NOT NULL,
  payload jsonb NOT NULL,
  status event_status NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  experienced_error boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  next_attempt_at timestamptz
);

CREATE INDEX idx_memberships_school_user ON school_memberships (school_id, user_id);
CREATE INDEX idx_class_instances_school_year ON class_instances (school_id, academic_year_id);
CREATE INDEX idx_attendance_sessions_school_date ON attendance_sessions (school_id, session_date);
CREATE INDEX idx_attendance_records_student ON attendance_records (school_id, student_id);
CREATE INDEX idx_invoices_school_student ON invoices (school_id, student_id);
CREATE INDEX idx_payments_school_student ON payments (school_id, student_id);
CREATE INDEX idx_messages_school_created ON messages (school_id, created_at DESC);
CREATE INDEX idx_audit_logs_school_created ON audit_logs (school_id, created_at DESC);
CREATE INDEX idx_event_outbox_status_next_attempt ON event_outbox (status, next_attempt_at, created_at);
