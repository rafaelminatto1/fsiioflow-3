// app/api/appointments/route.ts - Next.js API route for appointments
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../middleware/auth.middleware';
import { withCorsHeaders } from '../../../middleware/cors.middleware';
import { withPerformanceTracking } from '../../../middleware/performance.middleware';
import { 
  getAppointments, 
  saveAppointment,
  updateAppointment,
  deleteAppointment,
  getTodaysAppointments
} from '../../../services/optimized/appointmentService';

// GET /api/appointments - List appointments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    
    // Handle specific sections
    if (section === 'today') {
      const result = await getTodaysAppointments();
      return NextResponse.json({
        success: true,
        data: result.appointments,
        meta: {
          cacheHit: result.cacheHit,
          queryDuration: result.queryDuration,
        },
      });
    }
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const patientId = searchParams.get('patientId') || undefined;
    const therapistId = searchParams.get('therapistId') || undefined;
    const status = searchParams.get('status') || undefined;

    const result = await getAppointments({
      limit,
      cursor,
      startDate,
      endDate,
      patientId,
      therapistId,
      status,
    });

    return NextResponse.json({
      success: true,
      data: result.appointments,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor,
        totalCount: result.totalCount,
      },
      meta: {
        cacheHit: result.cacheHit,
        queryDuration: result.queryDuration,
      },
    });
  } catch (error) {
    console.error('GET /api/appointments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['patientId', 'therapistId', 'startTime', 'endTime', 'title', 'type'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: `Required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const appointmentData = {
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    };

    const newAppointment = await saveAppointment(appointmentData);

    return NextResponse.json(
      {
        success: true,
        data: newAppointment,
        message: 'Appointment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/appointments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create appointment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/appointments - Update appointment
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
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
    console.error('PUT /api/appointments error:', error);
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

// DELETE /api/appointments - Delete appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
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
    console.error('DELETE /api/appointments error:', error);
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

// Next.js App Router exports - middleware will be applied via middleware.ts
