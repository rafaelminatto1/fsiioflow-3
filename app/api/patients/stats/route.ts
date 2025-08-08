// app/api/patients/stats/route.ts - Patient statistics API route
import { NextRequest, NextResponse } from 'next/server';
import { getPatientStats } from '../../../../services/optimized/patientService';

// GET /api/patients/stats - Get patient statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const { stats, cacheHit, queryDuration } = await getPatientStats();

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        cacheHit,
        queryDuration,
      },
    });
  } catch (error) {
    console.error('GET /api/patients/stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patient statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
