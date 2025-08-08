// app/api/appointments/stats/route.ts - Appointment statistics API route
import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentStats } from '../../../../services/optimized/appointmentService';

// GET /api/appointments/stats - Get appointment statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const { stats, cacheHit, queryDuration } = await getAppointmentStats();

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        cacheHit,
        queryDuration,
      },
    });
  } catch (error) {
    console.error('GET /api/appointments/stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointment statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
