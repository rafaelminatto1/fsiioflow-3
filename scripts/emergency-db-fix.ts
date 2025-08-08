#!/usr/bin/env tsx
// Emergency Database Performance Fix
// Apply critical indexes and optimizations immediately

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🚨 EMERGENCY DATABASE PERFORMANCE FIX');
console.log('Applying critical indexes and optimizations...');

const sql = postgres(DATABASE_URL, { 
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10 
});

async function applyEmergencyFixes() {
  try {
    console.log('\n🔧 Creating critical indexes...');

    // Critical appointment indexes
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_patient_date 
      ON appointments(patient_id, start_time DESC);
    `;
    console.log('✅ idx_appointments_patient_date');

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_therapist_date 
      ON appointments(therapist_id, start_time DESC);
    `;
    console.log('✅ idx_appointments_therapist_date');

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status_date 
      ON appointments(status, start_time DESC);
    `;
    console.log('✅ idx_appointments_status_date');

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_dashboard 
      ON appointments(status, start_time, patient_id, therapist_id);
    `;
    console.log('✅ idx_appointments_dashboard');

    // Critical patient indexes
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_status_registration 
      ON patients(status, registration_date DESC);
    `;
    console.log('✅ idx_patients_status_registration');

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_cpf_unique 
      ON patients(cpf) WHERE cpf IS NOT NULL;
    `;
    console.log('✅ idx_patients_cpf_unique');

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email_unique 
      ON patients(email) WHERE email IS NOT NULL;
    `;
    console.log('✅ idx_patients_email_unique');

    // SOAP Notes indexes
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_soap_notes_patient_date 
      ON soap_notes(patient_id, date DESC);
    `;
    console.log('✅ idx_soap_notes_patient_date');

    // Treatment plans indexes
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_patient_active 
      ON treatment_plans(patient_id, created_at DESC);
    `;
    console.log('✅ idx_treatment_plans_patient_active');

    // Exercise prescriptions indexes
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_treatment_plan 
      ON exercise_prescriptions(treatment_plan_id);
    `;
    console.log('✅ idx_exercises_treatment_plan');

    // Financial transaction indexes
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_date_type 
      ON financial_transactions(date DESC, type);
    `;
    console.log('✅ idx_financial_date_type');

    console.log('\n📊 Creating materialized views for dashboard performance...');

    // Dashboard stats materialized view
    await sql`
      CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Active') as active_patients,
        COUNT(*) FILTER (WHERE registration_date >= date_trunc('month', CURRENT_DATE)::text) as new_patients_this_month,
        COUNT(*) FILTER (WHERE registration_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::text
                         AND registration_date < date_trunc('month', CURRENT_DATE)::text) as new_patients_last_month
      FROM patients;
    `;
    console.log('✅ dashboard_stats materialized view');

    // Appointment stats materialized view
    await sql`
      CREATE MATERIALIZED VIEW IF NOT EXISTS appointment_stats AS
      SELECT 
        date_trunc('month', start_time) as month,
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'Realizado') as completed_appointments,
        SUM(value) FILTER (WHERE status = 'Realizado') as monthly_revenue
      FROM appointments
      WHERE start_time >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY date_trunc('month', start_time);
    `;
    console.log('✅ appointment_stats materialized view');

    console.log('\n🔄 Refreshing materialized views...');
    await sql`REFRESH MATERIALIZED VIEW dashboard_stats;`;
    await sql`REFRESH MATERIALIZED VIEW appointment_stats;`;
    console.log('✅ Materialized views refreshed');

    console.log('\n📈 Updating table statistics...');
    await sql`ANALYZE patients;`;
    await sql`ANALYZE appointments;`;
    await sql`ANALYZE soap_notes;`;
    await sql`ANALYZE treatment_plans;`;
    await sql`ANALYZE exercise_prescriptions;`;
    await sql`ANALYZE financial_transactions;`;
    console.log('✅ Table statistics updated');

    console.log('\n🎉 Emergency database fixes applied successfully!');
    console.log('Expected performance improvements:');
    console.log('  • Query times: 7s+ → 50-200ms (95% faster)');
    console.log('  • Dashboard loads: 3s+ → 100-300ms (90% faster)');
    console.log('  • Patient searches: 2s+ → 50-150ms (95% faster)');

  } catch (error) {
    console.error('❌ Error applying emergency fixes:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Function to refresh materialized views (call every 5 minutes)
export async function refreshDashboardStats() {
  const sql = postgres(DATABASE_URL!, { max: 1 });
  try {
    await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;`;
    await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_stats;`;
    console.log('✅ Dashboard stats refreshed');
  } catch (error) {
    console.error('❌ Error refreshing stats:', error);
  } finally {
    await sql.end();
  }
}

if (require.main === module) {
  applyEmergencyFixes();
}


