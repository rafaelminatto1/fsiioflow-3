// app/api/appointments/[id]/route.ts - Dynamic route for individual appointment operations
import { NextRequest, NextResponse } from 'next/server';
import { 
  updateAppointment,
  deleteAppointment
} from '../../../../services/optimized/appointmentService';
import { db } from '../../../../lib/database';
import { appointments, patients, therapists } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/appointments/[id] - Get individual appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing appointment ID',
        },
        { status: 400 }
      );
    }

    // Get appointment with related data
    const result = await db
      .select({
        // Appointment fields
        id: appointments.id,
        patientId: appointments.patientId,
        therapistId: appointments.therapistId,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        title: appointments.title,
        type: appointments.type,
        status: appointments.status,
        value: appointments.value,
        paymentStatus: appointments.paymentStatus,
        observations: appointments.observations,
        seriesId: appointments.seriesId,
        recurrenceRule: appointments.recurrenceRule,
        sessionNumber: appointments.sessionNumber,
        totalSessions: appointments.totalSessions,
        
        // Patient fields
        patientName: patients.name,
        patientPhone: patients.phone,
        patientAvatarUrl: patients.avatarUrl,
        patientMedicalAlerts: patients.medicalAlerts,
        
        // Therapist fields
        therapistName: therapists.name,
        therapistColor: therapists.color,
        therapistAvatarUrl: therapists.avatarUrl,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
      .where(eq(appointments.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('GET /api/appointments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update individual appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing appointment ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Convert date strings to Date objects if present
    const updates = { ...body };
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);

    const updatedAppointment = await updateAppointment(id, updates);

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/appointments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update appointment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete individual appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing appointment ID',
        },
        { status: 400 }
      );
    }

    await deleteAppointment(id);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/appointments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete appointment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
