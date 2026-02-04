-- =========================
-- ENUM TYPES
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='user_role') THEN
    CREATE TYPE srm.user_role AS ENUM ('admin','manager','technician','customer');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='subscription_plan') THEN
    CREATE TYPE srm.subscription_plan AS ENUM ('single','small','medium','large','enterprise');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='subscription_status') THEN
    CREATE TYPE srm.subscription_status AS ENUM ('active','suspended','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='customer_type') THEN
    CREATE TYPE srm.customer_type AS ENUM ('individual','business');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='contact_method') THEN
    CREATE TYPE srm.contact_method AS ENUM ('email','sms','whatsapp','phone');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='device_type') THEN
    CREATE TYPE srm.device_type AS ENUM ('mobile','tablet','laptop','smartwatch','other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='warranty_status') THEN
    CREATE TYPE srm.warranty_status AS ENUM ('in_warranty','expired','no_warranty');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='repair_type') THEN
    CREATE TYPE srm.repair_type AS ENUM (
      'screen_replacement','battery_replacement','water_damage','software_issue','charging_port','camera','speaker','other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='repair_status') THEN
    CREATE TYPE srm.repair_status AS ENUM ('not_started','in_progress','ready_to_take','delivered','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='repair_priority') THEN
    CREATE TYPE srm.repair_priority AS ENUM ('low','medium','high','urgent');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='payment_status') THEN
    CREATE TYPE srm.payment_status AS ENUM ('unpaid','partial','paid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='photo_type') THEN
    CREATE TYPE srm.photo_type AS ENUM (
      'intake_front','intake_back','intake_screen','intake_damage',
      'before_repair','during_repair','after_repair','other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='notification_type') THEN
    CREATE TYPE srm.notification_type AS ENUM ('email','sms','whatsapp','push');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='notification_status') THEN
    CREATE TYPE srm.notification_status AS ENUM ('pending','sent','failed','delivered','read');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='template_type') THEN
    CREATE TYPE srm.template_type AS ENUM ('email','sms','whatsapp');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='payment_method') THEN
    CREATE TYPE srm.payment_method AS ENUM ('cash','card','bank_transfer','mobile_payment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='payment_type') THEN
    CREATE TYPE srm.payment_type AS ENUM ('advance','partial','full');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='invoice_status') THEN
    CREATE TYPE srm.invoice_status AS ENUM ('draft','sent','paid','overdue','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='srm' AND t.typname='report_file_format') THEN
    CREATE TYPE srm.report_file_format AS ENUM ('pdf','excel','csv');
  END IF;
END $$;

-- =========================
-- SHOPS (TENANT)
-- =========================
CREATE TABLE IF NOT EXISTS srm.shops (
  shop_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name               VARCHAR(200) NOT NULL,
  business_registration   VARCHAR(100),
  address                 TEXT,
  city                    VARCHAR(100),
  postal_code             VARCHAR(20),
  phone                   VARCHAR(20),
  email                   VARCHAR(100),
  website                 VARCHAR(255),
  logo_url                VARCHAR(500),
  tax_number              VARCHAR(50),
  subscription_plan       srm.subscription_plan,
  subscription_status     srm.subscription_status,
  subscription_start_date DATE,
  subscription_end_date   DATE,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS srm.users (
  user_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  password_hash         TEXT NOT NULL,
  first_name            VARCHAR(100),
  last_name             VARCHAR(100),
  phone                 VARCHAR(20),
  role                  srm.user_role NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  is_verified           BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled    BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret     VARCHAR(255),
  last_login            TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  account_locked_until  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email),
  UNIQUE (tenant_id, email)
);

-- =========================
-- CUSTOMERS
-- =========================
CREATE TABLE IF NOT EXISTS srm.customers (
  customer_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  user_id                   UUID REFERENCES srm.users(user_id) ON DELETE SET NULL, -- portal access optional
  first_name                VARCHAR(100) NOT NULL,
  last_name                 VARCHAR(100) NOT NULL,
  email                     VARCHAR(100),
  phone_primary             VARCHAR(20) NOT NULL,
  phone_secondary           VARCHAR(20),
  address                   TEXT,
  city                      VARCHAR(100),
  postal_code               VARCHAR(20),
  nic_number                VARCHAR(20),
  customer_type             srm.customer_type,
  company_name              VARCHAR(200),
  notes                     TEXT,
  preferred_contact_method  srm.contact_method,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- DEVICES
-- =========================
CREATE TABLE IF NOT EXISTS srm.devices (
  device_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  customer_id            UUID NOT NULL REFERENCES srm.customers(customer_id) ON DELETE CASCADE,
  device_type            srm.device_type,
  brand                  VARCHAR(100) NOT NULL,
  model                  VARCHAR(100) NOT NULL,
  imei_number            VARCHAR(20),
  serial_number          VARCHAR(100),
  color                  VARCHAR(50),
  storage_capacity       VARCHAR(20),
  purchase_date          DATE,
  warranty_status        srm.warranty_status,
  warranty_expiry_date   DATE,
  initial_condition      TEXT,
  password_pattern_lock  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (imei_number)
);

-- =========================
-- REPAIRS
-- =========================
CREATE TABLE IF NOT EXISTS srm.repairs (
  repair_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  customer_id                UUID NOT NULL REFERENCES srm.customers(customer_id) ON DELETE RESTRICT,
  device_id                  UUID NOT NULL REFERENCES srm.devices(device_id) ON DELETE RESTRICT,
  assigned_technician_id     UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  created_by_user_id         UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,

  job_number                 VARCHAR(50) NOT NULL,
  repair_type                srm.repair_type,
  reported_issue             TEXT NOT NULL,
  diagnosis                  TEXT,
  repair_notes               TEXT,
  status                     srm.repair_status NOT NULL DEFAULT 'not_started',
  priority                   srm.repair_priority NOT NULL DEFAULT 'medium',
  estimated_cost             DECIMAL(10,2),
  final_cost                 DECIMAL(10,2),
  advance_payment            DECIMAL(10,2),
  payment_status             srm.payment_status NOT NULL DEFAULT 'unpaid',

  estimated_completion_date  TIMESTAMPTZ,
  actual_completion_date     TIMESTAMPTZ,
  pickup_date                TIMESTAMPTZ,

  warranty_period_days       INTEGER NOT NULL DEFAULT 30,
  warranty_expiry_date       DATE,
  is_warranty_repair         BOOLEAN NOT NULL DEFAULT false,
  original_repair_id         UUID REFERENCES srm.repairs(repair_id) ON DELETE SET NULL,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (job_number)
);

-- =========================
-- REPAIR_STATUS_HISTORY
-- =========================
CREATE TABLE IF NOT EXISTS srm.repair_status_history (
  status_history_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id              UUID NOT NULL REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  old_status             VARCHAR(50),
  new_status             VARCHAR(50) NOT NULL,
  changed_by_user_id     UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  notes                  TEXT,
  changed_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- PHOTOS
-- =========================
CREATE TABLE IF NOT EXISTS srm.photos (
  photo_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  repair_id            UUID REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  device_id            UUID REFERENCES srm.devices(device_id) ON DELETE CASCADE,
  uploaded_by_user_id  UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,

  photo_type           srm.photo_type,
  file_name            VARCHAR(255) NOT NULL,
  file_path            VARCHAR(500) NOT NULL,
  file_url             VARCHAR(500),
  thumbnail_url        VARCHAR(500),
  cdn_url              VARCHAR(500),
  file_size            BIGINT,
  mime_type            VARCHAR(50),
  width                INTEGER,
  height               INTEGER,
  is_compressed        BOOLEAN NOT NULL DEFAULT false,
  metadata             JSONB,
  uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- PARTS_INVENTORY
-- =========================
CREATE TABLE IF NOT EXISTS srm.parts_inventory (
  part_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  part_name            VARCHAR(200) NOT NULL,
  part_number          VARCHAR(100),
  category             VARCHAR(100),
  compatible_brands    TEXT[],
  compatible_models    TEXT[],
  supplier_name        VARCHAR(200),
  quantity_in_stock    INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level  INTEGER NOT NULL DEFAULT 0,
  unit_cost            DECIMAL(10,2),
  selling_price        DECIMAL(10,2),
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- REPAIR_PARTS_USED
-- =========================
CREATE TABLE IF NOT EXISTS srm.repair_parts_used (
  repair_part_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id            UUID NOT NULL REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  part_id              UUID NOT NULL REFERENCES srm.parts_inventory(part_id) ON DELETE RESTRICT,
  quantity_used        INTEGER NOT NULL,
  unit_price           DECIMAL(10,2),
  total_price          DECIMAL(10,2),
  added_by_user_id     UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  added_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- ACCESSORIES
-- =========================
CREATE TABLE IF NOT EXISTS srm.accessories (
  accessory_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id            UUID NOT NULL REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  accessory_type       VARCHAR(100) NOT NULL,
  accessory_description TEXT,
  quantity             INTEGER NOT NULL DEFAULT 1,
  condition            VARCHAR(100),
  is_returned          BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- NOTIFICATION_TEMPLATES
-- =========================
CREATE TABLE IF NOT EXISTS srm.notification_templates (
  template_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID REFERENCES srm.shops(shop_id) ON DELETE CASCADE, -- NULL allowed for system templates
  template_name        VARCHAR(100) NOT NULL,
  template_type        srm.template_type NOT NULL,
  subject              VARCHAR(255),
  body_template        TEXT NOT NULL,
  variables            JSONB,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  is_system_template   BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS srm.notifications (
  notification_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  repair_id            UUID REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  customer_id          UUID REFERENCES srm.customers(customer_id) ON DELETE CASCADE,

  notification_type    srm.notification_type NOT NULL,
  template_name        VARCHAR(100),
  subject              VARCHAR(255),
  message_body         TEXT NOT NULL,
  recipient            VARCHAR(255) NOT NULL,

  status               srm.notification_status NOT NULL DEFAULT 'pending',
  sent_at              TIMESTAMPTZ,
  delivered_at         TIMESTAMPTZ,
  read_at              TIMESTAMPTZ,
  error_message        TEXT,
  retry_count          INTEGER NOT NULL DEFAULT 0,
  scheduled_at         TIMESTAMPTZ,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- PAYMENTS
-- =========================
CREATE TABLE IF NOT EXISTS srm.payments (
  payment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  repair_id            UUID NOT NULL REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES srm.customers(customer_id) ON DELETE CASCADE,

  payment_method       srm.payment_method NOT NULL,
  payment_type         srm.payment_type NOT NULL,
  amount               DECIMAL(10,2) NOT NULL,
  transaction_reference VARCHAR(100),
  payment_date         TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by_user_id  UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- INVOICES
-- =========================
CREATE TABLE IF NOT EXISTS srm.invoices (
  invoice_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  repair_id            UUID NOT NULL REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES srm.customers(customer_id) ON DELETE CASCADE,

  invoice_number       VARCHAR(50) NOT NULL,
  invoice_date         DATE NOT NULL,
  due_date             DATE,

  subtotal             DECIMAL(10,2),
  tax_amount           DECIMAL(10,2),
  discount_amount      DECIMAL(10,2),
  total_amount         DECIMAL(10,2) NOT NULL,
  paid_amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance              DECIMAL(10,2),

  status               srm.invoice_status NOT NULL DEFAULT 'draft',
  notes                TEXT,
  terms_and_conditions TEXT,

  created_by_user_id   UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (invoice_number),
  UNIQUE (repair_id) -- 1:1 repair -> invoice
);

-- =========================
-- JOB_SHEETS (1:1 with repairs)
-- =========================
CREATE TABLE IF NOT EXISTS srm.job_sheets (
  job_sheet_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id                UUID NOT NULL UNIQUE REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  qr_code_data             TEXT,
  qr_code_image_url        VARCHAR(500),
  terms_accepted           BOOLEAN NOT NULL DEFAULT false,
  customer_signature       TEXT,
  customer_signature_date  TIMESTAMPTZ,
  staff_signature          TEXT,
  staff_signature_date     TIMESTAMPTZ,
  generated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- AUDIT_LOGS
-- =========================
CREATE TABLE IF NOT EXISTS srm.audit_logs (
  log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  user_id             UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  action_type         VARCHAR(100) NOT NULL,
  entity_type         VARCHAR(100),
  entity_id           UUID,
  old_values          JSONB,
  new_values          JSONB,
  ip_address          VARCHAR(45),
  user_agent          TEXT,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS srm.sessions (
  session_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES srm.users(user_id) ON DELETE CASCADE,
  token              VARCHAR(500) UNIQUE NOT NULL,
  refresh_token      VARCHAR(500),
  device_fingerprint VARCHAR(255),
  ip_address         VARCHAR(45),
  user_agent         TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  expires_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity      TIMESTAMPTZ
);

-- =========================
-- TRUSTED_DEVICES
-- =========================
CREATE TABLE IF NOT EXISTS srm.trusted_devices (
  trusted_device_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES srm.users(user_id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name        VARCHAR(100),
  browser            VARCHAR(100),
  os                 VARCHAR(100),
  ip_address         VARCHAR(45),
  is_trusted         BOOLEAN NOT NULL DEFAULT true,
  last_used          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- RECOVERY_CODES
-- =========================
CREATE TABLE IF NOT EXISTS srm.recovery_codes (
  recovery_code_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES srm.users(user_id) ON DELETE CASCADE,
  code_hash          VARCHAR(255) NOT NULL,
  is_used            BOOLEAN NOT NULL DEFAULT false,
  used_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- CUSTOMER_FEEDBACK
-- =========================
CREATE TABLE IF NOT EXISTS srm.customer_feedback (
  feedback_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  repair_id              UUID NOT NULL REFERENCES srm.repairs(repair_id) ON DELETE CASCADE,
  customer_id            UUID NOT NULL REFERENCES srm.customers(customer_id) ON DELETE CASCADE,
  rating                 INTEGER CHECK (rating BETWEEN 1 AND 5),
  service_quality_rating INTEGER,
  timeliness_rating      INTEGER,
  price_rating           INTEGER,
  comments               TEXT,
  is_public              BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- SHOP_SETTINGS (1:1 with shops)
-- =========================
CREATE TABLE IF NOT EXISTS srm.shop_settings (
  setting_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL UNIQUE REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  business_hours            JSONB,
  notification_preferences  JSONB,
  email_settings            JSONB,
  sms_settings              JSONB,
  invoice_settings          JSONB,
  default_warranty_days     INTEGER NOT NULL DEFAULT 30,
  tax_rate                  DECIMAL(5,2),
  currency                  VARCHAR(10) NOT NULL DEFAULT 'LKR',
  timezone                  VARCHAR(50),
  date_format               VARCHAR(50),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- REPORTS_GENERATED
-- =========================
CREATE TABLE IF NOT EXISTS srm.reports_generated (
  report_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES srm.shops(shop_id) ON DELETE CASCADE,
  generated_by_user_id UUID REFERENCES srm.users(user_id) ON DELETE SET NULL,
  report_type          VARCHAR(100),
  report_name          VARCHAR(200),
  parameters           JSONB,
  file_path            VARCHAR(500),
  file_format          srm.report_file_format,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at           TIMESTAMPTZ
);
