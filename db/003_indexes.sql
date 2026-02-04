-- USERS
CREATE INDEX IF NOT EXISTS idx_users_tenant    ON srm.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email     ON srm.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON srm.users(role);

-- CUSTOMERS
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON srm.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone  ON srm.customers(phone_primary);
CREATE INDEX IF NOT EXISTS idx_customers_email  ON srm.customers(email);

-- DEVICES
CREATE INDEX IF NOT EXISTS idx_devices_tenant    ON srm.devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_customer  ON srm.devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_imei      ON srm.devices(imei_number);

-- REPAIRS
CREATE INDEX IF NOT EXISTS idx_repairs_tenant       ON srm.repairs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_repairs_customer     ON srm.repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_device       ON srm.repairs(device_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician   ON srm.repairs(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status       ON srm.repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_job_number   ON srm.repairs(job_number);
CREATE INDEX IF NOT EXISTS idx_repairs_created_at   ON srm.repairs(created_at DESC);

-- PHOTOS
CREATE INDEX IF NOT EXISTS idx_photos_tenant  ON srm.photos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_photos_repair  ON srm.photos(repair_id);
CREATE INDEX IF NOT EXISTS idx_photos_device  ON srm.photos(device_id);
CREATE INDEX IF NOT EXISTS idx_photos_type    ON srm.photos(photo_type);

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_tenant     ON srm.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_repair     ON srm.notifications(repair_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status     ON srm.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled  ON srm.notifications(scheduled_at);

-- PAYMENTS
CREATE INDEX IF NOT EXISTS idx_payments_tenant  ON srm.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_repair  ON srm.payments(repair_id);
CREATE INDEX IF NOT EXISTS idx_payments_date    ON srm.payments(payment_date DESC);

-- AUDIT_LOGS
CREATE INDEX IF NOT EXISTS idx_audit_tenant   ON srm.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user     ON srm.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity   ON srm.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON srm.audit_logs(created_at DESC);
