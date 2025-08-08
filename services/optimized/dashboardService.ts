// services/optimized/dashboardService.ts - High-performance dashboard service with aggregated queries
import { eq, desc, asc, count, sum, avg, and, gte, lte, sql } from 'drizzle-orm';
import { db, logQueryMetrics } from '../../lib/database';
import { appointments, patients, therapists, financialTransactions } from '../../lib/schema';
import { cacheQuery, CACHE_TTL, invalidateDashboardCache } from '../../lib/redis';

// Dashboard statistics interface
export interface DashboardStats {
  monthlyRevenue: {
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  activePatients: {
    value: string;
    subtitle: string;
  };
  newPatientsThisMonth: {
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  avgSatisfaction: {
    value: string;
    subtitle: string;
  };
}

// Performance monitoring wrapper
async function withPerformanceLogging<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    logQueryMetrics(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logQueryMetrics(`${operation} (ERROR)`, duration);
    throw error;
  }
}

// Utility function to calculate percentage change
const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return { change: '0%', changeType: 'increase' as const };
  const percentageChange = ((current - previous) / previous) * 100;
  return {
    change: `${Math.abs(percentageChange).toFixed(1)}%`,
    changeType: percentageChange >= 0 ? 'increase' as const : 'decrease' as const,
  };
};

// Comprehensive dashboard statistics with single aggregated query
export const getDashboardStats = async (): Promise<{
  stats: DashboardStats;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'dashboard:stats';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getDashboardStats', async () => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Single comprehensive query to get all dashboard metrics
        const [metricsResult] = await db
          .select({
            // Revenue metrics
            revenueThisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.startTime} >= ${startOfThisMonth} AND ${appointments.status} = 'Realizado' THEN ${appointments.value} ELSE 0 END), 0)`,
            revenueLastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.startTime} >= ${startOfLastMonth} AND ${appointments.startTime} <= ${endOfLastMonth} AND ${appointments.status} = 'Realizado' THEN ${appointments.value} ELSE 0 END), 0)`,
            
            // Patient metrics
            activePatientsCount: sql<number>`(SELECT COUNT(*) FROM ${patients} WHERE ${patients.status} = 'Active')`,
            newPatientsThisMonth: sql<number>`(SELECT COUNT(*) FROM ${patients} WHERE ${patients.registrationDate} >= ${startOfThisMonth.toISOString().split('T')[0]})`,
            newPatientsLastMonth: sql<number>`(SELECT COUNT(*) FROM ${patients} WHERE ${patients.registrationDate} >= ${startOfLastMonth.toISOString().split('T')[0]} AND ${patients.registrationDate} <= ${endOfLastMonth.toISOString().split('T')[0]})`,
            
            // Appointment metrics for satisfaction calculation
            completedAppointmentsThisMonth: count(sql`CASE WHEN ${appointments.startTime} >= ${startOfThisMonth} AND ${appointments.status} = 'Realizado' THEN 1 END`),
          })
          .from(appointments);
        
        const metrics = metricsResult || {
          revenueThisMonth: 0,
          revenueLastMonth: 0,
          activePatientsCount: 0,
          newPatientsThisMonth: 0,
          newPatientsLastMonth: 0,
          completedAppointmentsThisMonth: 0,
        };
        
        // Calculate changes
        const revenueChange = calculateChange(metrics.revenueThisMonth, metrics.revenueLastMonth);
        const newPatientsChange = calculateChange(metrics.newPatientsThisMonth, metrics.newPatientsLastMonth);
        
        // Format currency
        const formatCurrency = (value: number) => 
          new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(value);
        
        // Mock satisfaction score (in a real app, this would come from patient feedback)
        const mockSatisfactionScore = 4.7;
        
        return {
          monthlyRevenue: {
            value: formatCurrency(metrics.revenueThisMonth),
            change: revenueChange.change,
            changeType: revenueChange.changeType,
          },
          activePatients: {
            value: metrics.activePatientsCount.toString(),
            subtitle: 'pacientes em tratamento',
          },
          newPatientsThisMonth: {
            value: metrics.newPatientsThisMonth.toString(),
            change: newPatientsChange.change,
            changeType: newPatientsChange.changeType,
          },
          avgSatisfaction: {
            value: mockSatisfactionScore.toFixed(1),
            subtitle: 'de 5.0 estrelas',
          },
        };
      });
    }
  );
  
  return {
    stats: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Revenue chart data with optimized monthly aggregation
export const getRevenueChartData = async (): Promise<{
  chartData: Array<{
    month: string;
    revenue: number;
    appointments: number;
  }>;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'dashboard:revenue-chart';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getRevenueChartData', async () => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        // Aggregated query by month
        const result = await db
          .select({
            month: sql<string>`TO_CHAR(${appointments.startTime}, 'YYYY-MM')`,
            revenue: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.status} = 'Realizado' THEN ${appointments.value} ELSE 0 END), 0)`,
            appointments: count(sql`CASE WHEN ${appointments.status} = 'Realizado' THEN 1 END`),
          })
          .from(appointments)
          .where(gte(appointments.startTime, sixMonthsAgo))
          .groupBy(sql`TO_CHAR(${appointments.startTime}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${appointments.startTime}, 'YYYY-MM')`);
        
        // Format months to Portuguese
        const monthNames = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        return result.map(item => ({
          month: monthNames[parseInt(item.month.split('-')[1]) - 1],
          revenue: item.revenue,
          appointments: item.appointments,
        }));
      });
    }
  );
  
  return {
    chartData: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Patient flow chart data with optimized aggregation
export const getPatientFlowData = async (): Promise<{
  chartData: Array<{
    month: string;
    newPatients: number;
    activePatients: number;
  }>;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'dashboard:patient-flow';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getPatientFlowData', async () => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        // Get new patients by month
        const newPatientsResult = await db
          .select({
            month: sql<string>`TO_CHAR(TO_DATE(${patients.registrationDate}, 'YYYY-MM-DD'), 'YYYY-MM')`,
            newPatients: count(),
          })
          .from(patients)
          .where(gte(sql`TO_DATE(${patients.registrationDate}, 'YYYY-MM-DD')`, sixMonthsAgo))
          .groupBy(sql`TO_CHAR(TO_DATE(${patients.registrationDate}, 'YYYY-MM-DD'), 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(TO_DATE(${patients.registrationDate}, 'YYYY-MM-DD'), 'YYYY-MM')`);
        
        // Get total active patients (simplified - in reality, you'd track status changes over time)
        const [activeCount] = await db
          .select({ count: count() })
          .from(patients)
          .where(eq(patients.status, 'Active'));
        
        // Format data
        const monthNames = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        return newPatientsResult.map(item => ({
          month: monthNames[parseInt(item.month.split('-')[1]) - 1],
          newPatients: item.newPatients,
          activePatients: activeCount?.count || 0, // Simplified - should be historical data
        }));
      });
    }
  );
  
  return {
    chartData: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Team productivity with optimized therapist aggregation
export const getTeamProductivityData = async (): Promise<{
  chartData: Array<{
    therapist: string;
    appointments: number;
    revenue: number;
    efficiency: number;
  }>;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'dashboard:team-productivity';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getTeamProductivityData', async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const result = await db
          .select({
            therapistId: appointments.therapistId,
            therapistName: therapists.name,
            appointments: count(),
            completedAppointments: count(sql`CASE WHEN ${appointments.status} = 'Realizado' THEN 1 END`),
            revenue: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.status} = 'Realizado' THEN ${appointments.value} ELSE 0 END), 0)`,
          })
          .from(appointments)
          .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
          .where(gte(appointments.startTime, startOfMonth))
          .groupBy(appointments.therapistId, therapists.name);
        
        return result.map(item => ({
          therapist: item.therapistName,
          appointments: item.completedAppointments,
          revenue: item.revenue,
          efficiency: item.appointments > 0 ? (item.completedAppointments / item.appointments) * 100 : 0,
        }));
      });
    }
  );
  
  return {
    chartData: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Appointment heatmap data with optimized hourly aggregation
export const getAppointmentHeatmapData = async (): Promise<{
  heatmapData: Array<{
    day: string;
    [hour: string]: number | string;
  }>;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'dashboard:appointment-heatmap';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getAppointmentHeatmapData', async () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const result = await db
          .select({
            dayOfWeek: sql<number>`EXTRACT(DOW FROM ${appointments.startTime})`,
            hour: sql<number>`EXTRACT(HOUR FROM ${appointments.startTime})`,
            count: count(),
          })
          .from(appointments)
          .where(
            and(
              gte(appointments.startTime, thirtyDaysAgo),
              eq(appointments.status, 'Realizado')
            )
          )
          .groupBy(
            sql`EXTRACT(DOW FROM ${appointments.startTime})`,
            sql`EXTRACT(HOUR FROM ${appointments.startTime})`
          );
        
        // Create heatmap structure
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h to 19h
        
        const heatmapData = dayNames.map((day, dayIndex) => {
          const dayData: any = { day };
          
          hours.forEach(hour => {
            const hourKey = `${hour}h`;
            const found = result.find(r => r.dayOfWeek === dayIndex && r.hour === hour);
            dayData[hourKey] = found ? found.count : 0;
          });
          
          return dayData;
        });
        
        return heatmapData;
      });
    }
  );
  
  return {
    heatmapData: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Recent activity aggregation
export const getRecentActivity = async (): Promise<{
  activities: Array<{
    id: string;
    type: 'appointment' | 'patient' | 'payment';
    message: string;
    timestamp: Date;
    patientName?: string;
    avatarUrl?: string;
  }>;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'dashboard:recent-activity';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getRecentActivity', async () => {
        const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
        
        // Get recent appointments
        const recentAppointments = await db
          .select({
            id: appointments.id,
            type: sql<string>`'appointment'`,
            startTime: appointments.startTime,
            status: appointments.status,
            patientName: patients.name,
            avatarUrl: patients.avatarUrl,
          })
          .from(appointments)
          .innerJoin(patients, eq(appointments.patientId, patients.id))
          .where(
            and(
              gte(appointments.startTime, twentyFourHoursAgo),
              eq(appointments.status, 'Realizado')
            )
          )
          .orderBy(desc(appointments.startTime))
          .limit(10);
        
        // Get recent patients
        const recentPatients = await db
          .select({
            id: patients.id,
            type: sql<string>`'patient'`,
            createdAt: patients.createdAt,
            name: patients.name,
            avatarUrl: patients.avatarUrl,
          })
          .from(patients)
          .where(gte(patients.createdAt, twentyFourHoursAgo))
          .orderBy(desc(patients.createdAt))
          .limit(5);
        
        // Format activities
        const activities = [
          ...recentAppointments.map(apt => ({
            id: apt.id,
            type: 'appointment' as const,
            message: `Consulta realizada com ${apt.patientName}`,
            timestamp: apt.startTime,
            patientName: apt.patientName,
            avatarUrl: apt.avatarUrl,
          })),
          ...recentPatients.map(patient => ({
            id: patient.id,
            type: 'patient' as const,
            message: `Novo paciente cadastrado: ${patient.name}`,
            timestamp: patient.createdAt,
            patientName: patient.name,
            avatarUrl: patient.avatarUrl,
          })),
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
        
        return activities;
      });
    }
  );
  
  return {
    activities: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Health check for dashboard service
export const dashboardServiceHealthCheck = async () => {
  try {
    const start = Date.now();
    await db.select({ count: count() }).from(appointments).limit(1);
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration,
      service: 'dashboard',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'dashboard',
    };
  }
};
