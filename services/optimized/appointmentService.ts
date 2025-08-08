// services/optimized/appointmentService.ts - High-performance appointment service with caching
import { eq, desc, asc, count, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { db, logQueryMetrics } from '../../lib/database';
import { appointments, patients, therapists } from '../../lib/schema';
import { cacheQuery, CACHE_TTL, invalidateAppointmentCache } from '../../lib/redis';
import type { Appointment } from '../types';

// Enhanced appointment type with related data
export interface EnrichedAppointment extends Appointment {
  patientName: string;
  patientPhone: string;
  patientAvatarUrl: string;
  patientMedicalAlerts?: string;
  therapistName: string;
  therapistColor: string;
  therapistAvatarUrl: string;
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

// Optimized appointment list with cursor-based pagination
export const getAppointments = async ({
  limit = 20,
  cursor,
  startDate,
  endDate,
  patientId,
  therapistId,
  status,
}: {
  limit?: number;
  cursor?: string | null;
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  therapistId?: string;
  status?: string;
} = {}): Promise<{
  appointments: EnrichedAppointment[];
  nextCursor: string | null;
  totalCount: number;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  
  // Create cache key based on parameters
  const cacheKey = `appointments:list:${safeLimit}:${cursor || 'start'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}:${patientId || 'all'}:${therapistId || 'all'}:${status || 'all'}`;
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.APPOINTMENTS_LIST,
    async () => {
      return await withPerformanceLogging('getAppointments', async () => {
        // Build dynamic where conditions
        const conditions = [];
        
        if (cursor) {
          conditions.push(sql`${appointments.id} > ${cursor}`);
        }
        
        if (startDate) {
          conditions.push(gte(appointments.startTime, startDate));
        }
        
        if (endDate) {
          conditions.push(lte(appointments.startTime, endDate));
        }
        
        if (patientId) {
          conditions.push(eq(appointments.patientId, patientId));
        }
        
        if (therapistId) {
          conditions.push(eq(appointments.therapistId, therapistId));
        }
        
        if (status) {
          conditions.push(eq(appointments.status, status as any));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Single optimized query with joins instead of N+1 queries
        const appointmentsResult = await db
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
          .where(whereClause)
          .orderBy(desc(appointments.startTime), asc(appointments.id))
          .limit(safeLimit + 1);
        
        // Count query only when needed for pagination info
        const totalCountResult = await db
          .select({ count: count() })
          .from(appointments)
          .where(whereClause);
        
        const hasNextPage = appointmentsResult.length > safeLimit;
        const appointmentsData = hasNextPage ? appointmentsResult.slice(0, safeLimit) : appointmentsResult;
        const nextCursor = hasNextPage ? appointmentsData[appointmentsData.length - 1].id : null;
        
        return {
          appointments: appointmentsData,
          nextCursor,
          totalCount: totalCountResult[0]?.count || 0,
        };
      });
    }
  );
  
  return {
    ...data,
    cacheHit,
    queryDuration: duration,
  };
};

// Optimized appointment by patient ID with caching
export const getAppointmentsByPatientId = async (
  patientId: string,
  limit: number = 20
): Promise<{
  appointments: EnrichedAppointment[];
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = `appointments:patient:${patientId}:${limit}`;
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.APPOINTMENTS_LIST,
    async () => {
      return await withPerformanceLogging('getAppointmentsByPatientId', async () => {
        const result = await db
          .select({
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
            
            patientName: patients.name,
            patientPhone: patients.phone,
            patientAvatarUrl: patients.avatarUrl,
            patientMedicalAlerts: patients.medicalAlerts,
            
            therapistName: therapists.name,
            therapistColor: therapists.color,
            therapistAvatarUrl: therapists.avatarUrl,
          })
          .from(appointments)
          .innerJoin(patients, eq(appointments.patientId, patients.id))
          .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
          .where(eq(appointments.patientId, patientId))
          .orderBy(desc(appointments.startTime))
          .limit(limit);
        
        return result;
      });
    }
  );
  
  return {
    appointments: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Optimized appointment creation with cache invalidation
export const saveAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> => {
  return await withPerformanceLogging('saveAppointment', async () => {
    const result = await db.insert(appointments)
      .values(appointmentData)
      .returning();
    
    const newAppointment = result[0];
    
    // Invalidate relevant caches
    await invalidateAppointmentCache(appointmentData.patientId, appointmentData.therapistId);
    
    return newAppointment;
  });
};

// Optimized appointment update with cache invalidation
export const updateAppointment = async (
  id: string,
  updates: Partial<Appointment>
): Promise<Appointment> => {
  return await withPerformanceLogging('updateAppointment', async () => {
    const result = await db.update(appointments)
      .set({
        ...updates,
        updatedAt: sql`NOW()`,
      })
      .where(eq(appointments.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Appointment not found');
    }
    
    const updatedAppointment = result[0];
    
    // Invalidate caches
    await invalidateAppointmentCache(updatedAppointment.patientId, updatedAppointment.therapistId);
    
    return updatedAppointment;
  });
};

// Optimized appointment deletion
export const deleteAppointment = async (id: string): Promise<void> => {
  return await withPerformanceLogging('deleteAppointment', async () => {
    // Get appointment data before deletion for cache invalidation
    const appointmentToDelete = await db
      .select({ patientId: appointments.patientId, therapistId: appointments.therapistId })
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    
    const result = await db.delete(appointments)
      .where(eq(appointments.id, id))
      .returning({ id: appointments.id });
    
    if (result.length === 0) {
      throw new Error('Appointment not found');
    }
    
    // Invalidate caches if appointment existed
    if (appointmentToDelete[0]) {
      await invalidateAppointmentCache(
        appointmentToDelete[0].patientId, 
        appointmentToDelete[0].therapistId
      );
    }
  });
};

// Batch delete appointments (for series operations)
export const deleteAppointmentSeries = async (
  seriesId: string,
  fromDate?: Date
): Promise<number> => {
  return await withPerformanceLogging('deleteAppointmentSeries', async () => {
    const conditions = [eq(appointments.seriesId, seriesId)];
    
    if (fromDate) {
      conditions.push(gte(appointments.startTime, fromDate));
    }
    
    const result = await db.delete(appointments)
      .where(and(...conditions))
      .returning({ id: appointments.id });
    
    // Invalidate all appointment caches
    await invalidateAppointmentCache();
    
    return result.length;
  });
};

// Dashboard statistics with optimized aggregations
export const getAppointmentStats = async (): Promise<{
  stats: {
    totalToday: number;
    completedToday: number;
    scheduledToday: number;
    totalThisMonth: number;
    completedThisMonth: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
  };
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'appointments:stats';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getAppointmentStats', async () => {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));
        
        const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        
        // Single aggregation query instead of multiple queries
        const result = await db.select({
          totalToday: count(sql`CASE WHEN ${appointments.startTime} >= ${startOfToday} AND ${appointments.startTime} <= ${endOfToday} THEN 1 END`),
          completedToday: count(sql`CASE WHEN ${appointments.startTime} >= ${startOfToday} AND ${appointments.startTime} <= ${endOfToday} AND ${appointments.status} = 'Realizado' THEN 1 END`),
          scheduledToday: count(sql`CASE WHEN ${appointments.startTime} >= ${startOfToday} AND ${appointments.startTime} <= ${endOfToday} AND ${appointments.status} = 'Agendado' THEN 1 END`),
          totalThisMonth: count(sql`CASE WHEN ${appointments.startTime} >= ${startOfThisMonth} THEN 1 END`),
          completedThisMonth: count(sql`CASE WHEN ${appointments.startTime} >= ${startOfThisMonth} AND ${appointments.status} = 'Realizado' THEN 1 END`),
          revenueThisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.startTime} >= ${startOfThisMonth} AND ${appointments.status} = 'Realizado' THEN ${appointments.value} ELSE 0 END), 0)`,
          revenueLastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.startTime} >= ${startOfLastMonth} AND ${appointments.startTime} <= ${endOfLastMonth} AND ${appointments.status} = 'Realizado' THEN ${appointments.value} ELSE 0 END), 0)`,
        })
        .from(appointments);
        
        return result[0] || {
          totalToday: 0,
          completedToday: 0,
          scheduledToday: 0,
          totalThisMonth: 0,
          completedThisMonth: 0,
          revenueThisMonth: 0,
          revenueLastMonth: 0,
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

// Optimized upcoming appointments for today's view
export const getTodaysAppointments = async (): Promise<{
  appointments: EnrichedAppointment[];
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'appointments:today';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.APPOINTMENTS_LIST,
    async () => {
      return await withPerformanceLogging('getTodaysAppointments', async () => {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        
        return await db
          .select({
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
            
            patientName: patients.name,
            patientPhone: patients.phone,
            patientAvatarUrl: patients.avatarUrl,
            patientMedicalAlerts: patients.medicalAlerts,
            
            therapistName: therapists.name,
            therapistColor: therapists.color,
            therapistAvatarUrl: therapists.avatarUrl,
          })
          .from(appointments)
          .innerJoin(patients, eq(appointments.patientId, patients.id))
          .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
          .where(
            and(
              gte(appointments.startTime, startOfDay),
              lte(appointments.startTime, endOfDay)
            )
          )
          .orderBy(asc(appointments.startTime));
      });
    }
  );
  
  return {
    appointments: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Health check for appointment service
export const appointmentServiceHealthCheck = async () => {
  try {
    const start = Date.now();
    await db.select({ count: count() }).from(appointments).limit(1);
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration,
      service: 'appointment',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'appointment',
    };
  }
};
