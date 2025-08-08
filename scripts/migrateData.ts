// scripts/migrateData.ts - Migration script from mock data to database
import { db } from '../lib/database';
import { patients, therapists, appointments, soapNotes, treatmentPlans } from '../lib/schema';
import { mockPatients, mockTherapists, mockAppointments, mockSoapNotes, mockTreatmentPlans } from '../data/mockData';

async function migrateData() {
  console.log('🚀 Starting data migration...');
  
  try {
    // 1. Migrate Therapists first (referenced by appointments)
    console.log('👨‍⚕️ Migrating therapists...');
    await db.insert(therapists).values(
      mockTherapists.map(therapist => ({
        id: therapist.id,
        name: therapist.name,
        color: therapist.color,
        avatarUrl: therapist.avatarUrl,
      }))
    );
    console.log(`✅ Migrated ${mockTherapists.length} therapists`);

    // 2. Migrate Patients
    console.log('👥 Migrating patients...');
    await db.insert(patients).values(
      mockPatients.map(patient => ({
        id: patient.id,
        name: patient.name,
        cpf: patient.cpf,
        birthDate: patient.birthDate,
        phone: patient.phone,
        email: patient.email,
        emergencyContact: patient.emergencyContact,
        address: patient.address,
        status: patient.status as any,
        lastVisit: patient.lastVisit,
        registrationDate: patient.registrationDate,
        avatarUrl: patient.avatarUrl,
        consentGiven: patient.consentGiven,
        whatsappConsent: patient.whatsappConsent as any,
        allergies: patient.allergies,
        medicalAlerts: patient.medicalAlerts,
        surgeries: patient.surgeries,
        conditions: patient.conditions,
        attachments: patient.attachments,
        trackedMetrics: patient.trackedMetrics,
      }))
    );
    console.log(`✅ Migrated ${mockPatients.length} patients`);

    // 3. Migrate Appointments
    console.log('📅 Migrating appointments...');
    await db.insert(appointments).values(
      mockAppointments.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patientId,
        therapistId: appointment.therapistId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        title: appointment.title,
        type: appointment.type as any,
        status: appointment.status as any,
        value: appointment.value.toString(),
        paymentStatus: appointment.paymentStatus,
        observations: appointment.observations,
        seriesId: appointment.seriesId,
        recurrenceRule: appointment.recurrenceRule,
        sessionNumber: appointment.sessionNumber,
        totalSessions: appointment.totalSessions,
      }))
    );
    console.log(`✅ Migrated ${mockAppointments.length} appointments`);

    // 4. Migrate SOAP Notes
    console.log('📋 Migrating SOAP notes...');
    await db.insert(soapNotes).values(
      mockSoapNotes.map(note => ({
        id: note.id,
        patientId: note.patientId,
        date: note.date,
        therapist: note.therapist,
        sessionNumber: note.sessionNumber,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        bodyParts: note.bodyParts,
        painScale: note.painScale,
        attachments: note.attachments,
        metricResults: note.metricResults,
      }))
    );
    console.log(`✅ Migrated ${mockSoapNotes.length} SOAP notes`);

    // 5. Migrate Treatment Plans
    console.log('📋 Migrating treatment plans...');
    await db.insert(treatmentPlans).values(
      mockTreatmentPlans.map(plan => ({
        id: plan.id,
        patientId: plan.patientId,
        coffitoDiagnosisCodes: plan.coffitoDiagnosisCodes,
        treatmentGoals: plan.treatmentGoals,
        frequencyPerWeek: plan.frequencyPerWeek,
        durationWeeks: plan.durationWeeks,
        modalities: plan.modalities,
        outcomeMeasures: plan.outcomeMeasures,
        createdByCrefito: plan.createdByCrefito,
      }))
    );
    console.log(`✅ Migrated ${mockTreatmentPlans.length} treatment plans`);

    console.log('🎉 Data migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`  - Therapists: ${mockTherapists.length}`);
    console.log(`  - Patients: ${mockPatients.length}`);
    console.log(`  - Appointments: ${mockAppointments.length}`);
    console.log(`  - SOAP Notes: ${mockSoapNotes.length}`);
    console.log(`  - Treatment Plans: ${mockTreatmentPlans.length}`);
    console.log('');
    console.log('🚀 Your application is now ready to use the optimized database!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().then(() => process.exit(0));
}

export { migrateData };
