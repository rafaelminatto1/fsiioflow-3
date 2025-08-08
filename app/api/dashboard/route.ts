// app/api/dashboard/route.ts - Next.js API route for dashboard
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../middleware/auth.middleware';
import { withCorsHeaders } from '../../../middleware/cors.middleware';
import { withPerformanceTracking } from '../../../middleware/performance.middleware';
import { 
  getDashboardStats, 
  getRevenueChartData, 
  getPatientFlowData,
  getTeamProductivityData,
  getAppointmentHeatmapData,
  getRecentActivity
} from '../../../services/optimized/dashboardService';

// GET /api/dashboard - Get comprehensive dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';

    // Handle specific dashboard sections
    switch (section) {
      case 'stats':
        const statsResult = await getDashboardStats();
        return NextResponse.json({
          success: true,
          data: statsResult.stats,
          meta: {
            cacheHit: statsResult.cacheHit,
            queryDuration: statsResult.queryDuration,
          },
        });

      case 'revenue':
        const revenueResult = await getRevenueChartData();
        return NextResponse.json({
          success: true,
          data: revenueResult.chartData,
          meta: {
            cacheHit: revenueResult.cacheHit,
            queryDuration: revenueResult.queryDuration,
          },
        });

      case 'patients':
        const patientsResult = await getPatientFlowData();
        return NextResponse.json({
          success: true,
          data: patientsResult.chartData,
          meta: {
            cacheHit: patientsResult.cacheHit,
            queryDuration: patientsResult.queryDuration,
          },
        });

      case 'team':
        const teamResult = await getTeamProductivityData();
        return NextResponse.json({
          success: true,
          data: teamResult.chartData,
          meta: {
            cacheHit: teamResult.cacheHit,
            queryDuration: teamResult.queryDuration,
          },
        });

      case 'heatmap':
        const heatmapResult = await getAppointmentHeatmapData();
        return NextResponse.json({
          success: true,
          data: heatmapResult.heatmapData,
          meta: {
            cacheHit: heatmapResult.cacheHit,
            queryDuration: heatmapResult.queryDuration,
          },
        });

      case 'activity':
        const activityResult = await getRecentActivity();
        return NextResponse.json({
          success: true,
          data: activityResult.activities,
          meta: {
            cacheHit: activityResult.cacheHit,
            queryDuration: activityResult.queryDuration,
          },
        });

      case 'all':
      default:
        // Get all dashboard data in parallel for better performance
        const [stats, revenue, patients, team, heatmap, activity] = await Promise.all([
          getDashboardStats(),
          getRevenueChartData(),
          getPatientFlowData(),
          getTeamProductivityData(),
          getAppointmentHeatmapData(),
          getRecentActivity(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            stats: stats.stats,
            revenue: revenue.chartData,
            patients: patients.chartData,
            team: team.chartData,
            heatmap: heatmap.heatmapData,
            activity: activity.activities,
          },
          meta: {
            cacheHits: {
              stats: stats.cacheHit,
              revenue: revenue.cacheHit,
              patients: patients.cacheHit,
              team: team.cacheHit,
              heatmap: heatmap.cacheHit,
              activity: activity.cacheHit,
            },
            queryDurations: {
              stats: stats.queryDuration,
              revenue: revenue.queryDuration,
              patients: patients.queryDuration,
              team: team.queryDuration,
              heatmap: heatmap.queryDuration,
              activity: activity.queryDuration,
            },
            totalDuration: [stats, revenue, patients, team, heatmap, activity]
              .reduce((sum, result) => sum + result.queryDuration, 0),
          },
        });
    }
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Next.js App Router exports - middleware will be applied via middleware.ts
