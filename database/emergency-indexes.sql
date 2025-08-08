-- 🚨 EMERGENCY DATABASE INDEXES - APPLY IMMEDIATELY
-- These indexes will fix 7+ second query times

-- ===== CRITICAL INDEXES FOR APPOINTMENTS =====
-- Fix appointment queries (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_patient_date 
  ON appointments(patient_id, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_therapist_date 
  ON appointments(therapist_id, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status_date 
  ON appointments(status, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date_range 
  ON appointments(start_time, end_time);

-- Composite index for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_dashboard 
  ON appointments(status, start_time, patient_id, therapist_id);

-- ===== CRITICAL INDEXES FOR PATIENTS =====
-- Fix patient lookup performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_status_registration 
  ON patients(status, registration_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_name_search 
  ON patients USING gin(to_tsvector('portuguese', name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_cpf_unique 
  ON patients(cpf) WHERE cpf IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email_unique 
  ON patients(email) WHERE email IS NOT NULL;

-- ===== CRITICAL INDEXES FOR SOAP NOTES =====
-- Fix treatment history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_soap_notes_patient_date 
  ON soap_notes(patient_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_soap_notes_appointment 
  ON soap_notes(appointment_id);

-- ===== CRITICAL INDEXES FOR TREATMENT PLANS =====
-- Fix treatment plan queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_patient_active 
  ON treatment_plans(patient_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_therapist 
  ON treatment_plans(therapist_id);

-- ===== CRITICAL INDEXES FOR EXERCISES =====
-- Fix exercise queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_treatment_plan 
  ON exercises(treatment_plan_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_category 
  ON exercises(category);

-- ===== CRITICAL INDEXES FOR THERAPISTS =====
-- Fix therapist queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_therapists_active 
  ON therapists(is_active, name);

-- ===== CRITICAL INDEXES FOR FINANCIAL TRANSACTIONS =====
-- Fix financial dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_date_type 
  ON financial_transactions(date DESC, type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_patient 
  ON financial_transactions(patient_id, date DESC);

-- ===== CRITICAL INDEXES FOR MEDICAL REPORTS =====
-- Fix report queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_reports_patient_date 
  ON medical_reports(patient_id, generated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_reports_status 
  ON medical_reports(status, generated_at DESC);

-- ===== CRITICAL INDEXES FOR VOUCHERS =====
-- Fix voucher queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_patient_status 
  ON vouchers(patient_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_expiry 
  ON vouchers(expiry_date) WHERE status = 'active';

-- ===== QUERY OPTIMIZATION VIEWS =====
-- Pre-computed view for dashboard stats (updates every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'Active') as active_patients,
  COUNT(*) FILTER (WHERE registration_date >= date_trunc('month', CURRENT_DATE)) as new_patients_this_month,
  COUNT(*) FILTER (WHERE registration_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                   AND registration_date < date_trunc('month', CURRENT_DATE)) as new_patients_last_month
FROM patients;

-- Index for materialized view
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_refresh 
  ON dashboard_stats(active_patients, new_patients_this_month);

-- Pre-computed view for appointment stats
CREATE MATERIALIZED VIEW IF NOT EXISTS appointment_stats AS
SELECT 
  date_trunc('month', start_time) as month,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE status = 'Completed') as completed_appointments,
  SUM(value) FILTER (WHERE status = 'Completed') as monthly_revenue
FROM appointments
WHERE start_time >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date_trunc('month', start_time);

-- Index for appointment stats
CREATE INDEX IF NOT EXISTS idx_appointment_stats_month 
  ON appointment_stats(month DESC);

-- ===== PERFORMANCE MONITORING =====
-- Track slow queries
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY n_distinct DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- ===== REFRESH MATERIALIZED VIEWS PROCEDURE =====
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes (add to cron or scheduler)
-- SELECT cron.schedule('refresh-stats', '*/5 * * * *', 'SELECT refresh_dashboard_stats();');

-- ===== IMMEDIATE PERFORMANCE BOOST =====
-- Update table statistics for better query planning
ANALYZE patients;
ANALYZE appointments; 
ANALYZE soap_notes;
ANALYZE treatment_plans;
ANALYZE exercises;
ANALYZE therapists;
ANALYZE financial_transactions;
ANALYZE medical_reports;
ANALYZE vouchers;

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE;

-- ===== EMERGENCY CONNECTION POOLING =====
-- Set optimal connection settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Apply settings (requires restart)
SELECT pg_reload_conf();
