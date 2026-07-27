-- ============================================================
-- Phase 1: Client Unification — accounts → clients data migration
-- ============================================================
-- WARNING: Backup DB first!
-- Run: mysqldump pms > /root/pms_backup_before_phase1.sql
-- Then: mysql pms < scripts/phase1_client_unification.sql
-- ============================================================

START TRANSACTION;

-- Step 1: Copy missing accounts data into clients
-- Match by company_name (best guess), update missing fields
UPDATE pms.clients c
INNER JOIN pms.accounts a ON c.name = a.company_name
SET
  c.gst_number = COALESCE(c.gst_number, a.gst_no),
  c.contact_name = COALESCE(c.contact_name, a.contact_name),
  c.contact_email = COALESCE(c.contact_email, a.contact_email),
  c.contact_phone = COALESCE(c.contact_phone, a.contact_phone),
  c.website = COALESCE(c.website, a.website),
  c.location = COALESCE(c.location, a.location),
  c.registered_address = COALESCE(c.registered_address, a.address),
  c.state = COALESCE(c.state, a.state),
  c.industry = COALESCE(c.industry, a.industry),
  c.business_type = COALESCE(c.business_type, a.account_type);

-- Step 2: Create client records for accounts that have no matching client
INSERT INTO pms.clients (name, client_code, business_type, status, client_type, gst_number, contact_name, contact_email, contact_phone, location, registered_address, state, state_code, website, industry, created_at, updated_at)
SELECT
  a.company_name,
  CONCAT('ACC', a.id),
  COALESCE(a.account_type, 'B2B'),
  CASE WHEN a.status IN ('Active','active') THEN 'ACTIVE' ELSE 'PROSPECT' END,
  'main',
  a.gst_no,
  a.contact_name,
  a.contact_email,
  a.contact_phone,
  a.location,
  a.address,
  a.state,
  a.state_code,
  a.website,
  a.industry,
  a.created_at,
  a.updated_at
FROM pms.accounts a
LEFT JOIN pms.clients c ON c.name = a.company_name
WHERE c.id IS NULL;

-- Step 3: Remap contacts.account_id → contacts.client_id
-- Add client_id column if not exists
ALTER TABLE pms.contacts ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.contacts ct
INNER JOIN pms.clients c ON ct.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET ct.client_id = c.id
WHERE ct.client_id IS NULL;

-- Step 4: Remap projects.account_id → projects.client_id
UPDATE pms.projects p
INNER JOIN pms.clients c ON p.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET p.client_id = c.id
WHERE p.client_id IS NULL AND p.account_id IS NOT NULL;

-- Step 5: Remap opportunities.account_id → opportunities.client_id
-- (Add client_id column if not present)
ALTER TABLE pms.opportunities ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.opportunities o
INNER JOIN pms.clients c ON o.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET o.client_id = c.id
WHERE o.client_id IS NULL AND o.account_id IS NOT NULL;

-- Step 6: Remap users.account_id → users.client_id
ALTER TABLE pms.users ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.users u
INNER JOIN pms.clients c ON u.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET u.client_id = c.id
WHERE u.client_id IS NULL AND u.account_id IS NOT NULL;

-- Step 7: Remap vulnerabilities.account_id → vulnerabilities.client_id
ALTER TABLE pms.vulnerabilities ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.vulnerabilities v
INNER JOIN pms.clients c ON v.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET v.client_id = c.id
WHERE v.client_id IS NULL AND v.account_id IS NOT NULL;

-- Step 8: Remap leads.account_id / referring_account_id
ALTER TABLE pms.leads ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
ALTER TABLE pms.leads ADD COLUMN IF NOT EXISTS referring_client_id INT NULL AFTER referring_account_id;
UPDATE pms.leads l
INNER JOIN pms.clients c ON l.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET l.client_id = c.id
WHERE l.client_id IS NULL AND l.account_id IS NOT NULL;

-- Step 9: Remap client_portal tables
ALTER TABLE pms.client_portal_users ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.client_portal_users cpu
INNER JOIN pms.clients c ON cpu.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET cpu.client_id = c.id
WHERE cpu.client_id IS NULL AND cpu.account_id IS NOT NULL;

ALTER TABLE pms.meeting_requests ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.meeting_requests mr
INNER JOIN pms.clients c ON mr.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET mr.client_id = c.id
WHERE mr.client_id IS NULL AND mr.account_id IS NOT NULL;

ALTER TABLE pms.finding_queries ADD COLUMN IF NOT EXISTS client_id INT NULL AFTER account_id;
UPDATE pms.finding_queries fq
INNER JOIN pms.clients c ON fq.account_id IN (SELECT id FROM pms.accounts WHERE company_name = c.name)
SET fq.client_id = c.id
WHERE fq.client_id IS NULL AND fq.account_id IS NOT NULL;

-- Step 10: Verification queries
SELECT '=== VERIFICATION ===' AS '';
SELECT 'accounts table count' AS label, COUNT(*) AS cnt FROM pms.accounts;
SELECT 'clients table count' AS label, COUNT(*) AS cnt FROM pms.clients;
SELECT 'orphan projects (no client_id)' AS label, COUNT(*) AS cnt FROM pms.projects WHERE client_id IS NULL;
SELECT 'orphan contacts (no client_id)' AS label, COUNT(*) AS cnt FROM pms.contacts WHERE client_id IS NULL;
SELECT 'orphan opportunities (no client_id)' AS label, COUNT(*) AS cnt FROM pms.opportunities WHERE client_id IS NULL;

-- ROLLBACK; -- Uncomment to test without committing
-- COMMIT; -- Uncomment when ready to apply
