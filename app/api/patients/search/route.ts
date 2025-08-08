// app/api/patients/search/route.ts - Patient search API route
import { NextRequest, NextResponse } from 'next/server';
import { searchPatients } from '../../../../services/optimized/patientService';

// GET /api/patients/search - Search patients by query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters long',
        },
        { status: 400 }
      );
    }

    const { patients, cacheHit, queryDuration } = await searchPatients(query.trim(), limit);

    return NextResponse.json({
      success: true,
      data: patients,
      meta: {
        query: query.trim(),
        resultsCount: patients.length,
        cacheHit,
        queryDuration,
      },
    });
  } catch (error) {
    console.error('GET /api/patients/search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search patients',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
