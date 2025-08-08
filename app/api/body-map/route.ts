// app/api/body-map/route.ts - CRUD for Body Map evolutions
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../middleware/auth.middleware';
import { withCorsHeaders } from '../../../middleware/cors.middleware';
import { withPerformanceTracking } from '../../../middleware/performance.middleware';
import { createEvolution, getEvolutions, getPresetFromLastEvolution } from '../../../services/bodyMapService';

async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const preset = searchParams.get('preset') === 'true';
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
    }

    if (preset) {
      const data = await getPresetFromLastEvolution(patientId);
      return NextResponse.json({ success: true, data });
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const data = await getEvolutions({ patientId, startDate, endDate, limit });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/body-map error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch body map evolutions' }, { status: 500 });
  }
}

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, regions } = body || {};
    if (!patientId || !Array.isArray(regions) || regions.length === 0) {
      return NextResponse.json({ success: false, error: 'patientId and non-empty regions are required' }, { status: 400 });
    }
    const result = await createEvolution(body);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('POST /api/body-map error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create evolution' }, { status: 500 });
  }
}

export const GET_HANDLER = withPerformanceTracking(withCorsHeaders(withAuth(GET, 'Fisioterapeuta')));
export const POST_HANDLER = withPerformanceTracking(withCorsHeaders(withAuth(POST, 'Fisioterapeuta')));

export { GET_HANDLER as GET, POST_HANDLER as POST };


