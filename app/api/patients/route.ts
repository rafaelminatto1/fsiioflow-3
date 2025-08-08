// app/api/patients/route.ts - Next.js API route for patients
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../middleware/auth.middleware';
import { withCorsHeaders } from '../../../middleware/cors.middleware';
import { withPerformanceTracking } from '../../../middleware/performance.middleware';
import { getPatients, addPatient } from '../../../services/optimized/patientService';

// GET /api/patients - List patients with pagination and filters
async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');
    const searchTerm = searchParams.get('search') || undefined;
    const statusFilter = searchParams.get('status') || undefined;

    const result = await getPatients({
      limit,
      cursor,
      searchTerm,
      statusFilter,
    });

    return NextResponse.json({
      success: true,
      data: result.patients,
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
    console.error('GET /api/patients error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch patients',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create new patient
async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'cpf', 'birthDate', 'phone'];
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

    const newPatient = await addPatient(body);

    return NextResponse.json(
      {
        success: true,
        data: newPatient,
        message: 'Patient created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/patients error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create patient',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Apply middleware
export const GET_HANDLER = withPerformanceTracking(
  withCorsHeaders(
    withAuth(GET, 'Fisioterapeuta')
  )
);

export const POST_HANDLER = withPerformanceTracking(
  withCorsHeaders(
    withAuth(POST, 'Fisioterapeuta')
  )
);

export { GET_HANDLER as GET, POST_HANDLER as POST };
