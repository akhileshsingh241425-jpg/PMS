-- Step 0: Pre-flight row counts
-- Run: mysql -N pms < scripts/step0_preflight.sql

SELECT 'accounts', COUNT(*) FROM pms.accounts
UNION ALL SELECT 'clients', COUNT(*) FROM pms.clients
UNION ALL SELECT 'projects', COUNT(*) FROM pms.projects
UNION ALL SELECT 'po_in (direction=IN)', COUNT(*) FROM pms.projects WHERE direction='IN'
UNION ALL SELECT 'po_out (direction=OUT)', COUNT(*) FROM pms.projects WHERE direction='OUT'
UNION ALL SELECT 'contacts', COUNT(*) FROM pms.contacts
UNION ALL SELECT 'users', COUNT(*) FROM pms.users
UNION ALL SELECT 'opportunities', COUNT(*) FROM pms.opportunities
UNION ALL SELECT 'leads', COUNT(*) FROM pms.leads
UNION ALL SELECT 'vulnerabilities', COUNT(*) FROM pms.vulnerabilities
UNION ALL SELECT 'account_types', COUNT(*) FROM pms.account_types
UNION ALL SELECT 'client_types', COUNT(*) FROM pms.client_types;
