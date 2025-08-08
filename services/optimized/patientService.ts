// services/optimized/patientService.ts - High-performance patient service with caching and pagination
import { eq, desc, asc, count, ilike, and, or, sql } from 'drizzle-orm';
import { db, logQueryMetrics } from '../../lib/database';
import { patients } from '../../lib/schema';
import { cacheQuery, CACHE_TTL, invalidatePatientCache } from '../../lib/redis';
import type { Patient, PatientSummary } from '../types';

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

// Optimized patient list with cursor-based pagination and caching
export const getPatients = async ({ 
  limit = 20, 
  cursor, 
  searchTerm, 
  statusFilter 
}: {
  limit?: number;
  cursor?: string | null;
  searchTerm?: string;
  statusFilter?: string;
}): Promise<{ 
  patients: PatientSummary[]; 
  nextCursor: string | null;
  totalCount: number;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  // Validate and limit page size for security
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  
  // Create cache key based on parameters
  const cacheKey = `patients:list:${safeLimit}:${cursor || 'start'}:${searchTerm || 'all'}:${statusFilter || 'all'}`;
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.PATIENTS_LIST,
    async () => {
      return await withPerformanceLogging('getPatients', async () => {
        // Build dynamic where conditions
        const conditions = [];
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          conditions.push(
            or(
              ilike(patients.name, `%${searchTerm}%`),
              ilike(patients.cpf, `%${searchTerm}%`),
              ilike(patients.email, `%${searchTerm}%`)
            )
          );
        }
        
        if (statusFilter && statusFilter !== 'All') {
          conditions.push(eq(patients.status, statusFilter as any));
        }
        
        // Add cursor condition for pagination
        if (cursor) {
          conditions.push(sql`${patients.id} > ${cursor}`);
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Execute optimized queries in parallel
        const [patientsResult, totalCountResult] = await Promise.all([
          // Main query - select only needed fields for list view
          db.select({
            id: patients.id,
            name: patients.name,
            email: patients.email,
            phone: patients.phone,
            status: patients.status,
            lastVisit: patients.lastVisit,
            avatarUrl: patients.avatarUrl,
            medicalAlerts: patients.medicalAlerts,
          })
          .from(patients)
          .where(whereClause)
          .orderBy(desc(patients.lastVisit), asc(patients.id)) // Consistent ordering for pagination
          .limit(safeLimit + 1), // +1 to check if there's a next page
          
          // Count query - only when needed
          searchTerm || statusFilter 
            ? db.select({ count: count() }).from(patients).where(whereClause)
            : Promise.resolve([{ count: 0 }]) // Skip count for performance on unfiltered queries
        ]);
        
        const hasNextPage = patientsResult.length > safeLimit;
        const patientsData = hasNextPage ? patientsResult.slice(0, safeLimit) : patientsResult;
        const nextCursor = hasNextPage ? patientsData[patientsData.length - 1].id : null;
        
        return {
          patients: patientsData,
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

// Optimized single patient fetch with caching
export const getPatientById = async (id: string): Promise<{
  patient: Patient | null;
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = `patients:${id}`;
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.PATIENT_DETAIL,
    async () => {
      return await withPerformanceLogging('getPatientById', async () => {
        const result = await db.select()
          .from(patients)
          .where(eq(patients.id, id))
          .limit(1);
        
        return result[0] || null;
      });
    }
  );
  
  return {
    patient: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Optimized patient creation with cache invalidation
export const addPatient = async (
  patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Patient> => {
  return await withPerformanceLogging('addPatient', async () => {
    const result = await db.insert(patients)
      .values({
        ...patientData,
        registrationDate: new Date().toISOString().split('T')[0],
        lastVisit: new Date().toISOString().split('T')[0],
      })
      .returning();
    
    const newPatient = result[0];
    
    // Invalidate relevant caches
    await invalidatePatientCache();
    
    return newPatient;
  });
};

// Optimized patient update with cache invalidation
export const updatePatient = async (
  id: string,
  updates: Partial<Patient>
): Promise<Patient> => {
  return await withPerformanceLogging('updatePatient', async () => {
    const result = await db.update(patients)
      .set({
        ...updates,
        updatedAt: sql`NOW()`,
      })
      .where(eq(patients.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Patient not found');
    }
    
    const updatedPatient = result[0];
    
    // Invalidate specific patient cache and list caches
    await invalidatePatientCache(id);
    
    return updatedPatient;
  });
};

// Batch patient operations for better performance
export const getPatientsByIds = async (
  ids: string[]
): Promise<{ 
  patients: Patient[];
  cacheHit: boolean;
  queryDuration: number;
}> => {
  if (ids.length === 0) {
    return { patients: [], cacheHit: false, queryDuration: 0 };
  }
  
  const cacheKey = `patients:batch:${ids.sort().join(',')}`;
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.PATIENT_DETAIL,
    async () => {
      return await withPerformanceLogging('getPatientsByIds', async () => {
        return await db.select()
          .from(patients)
          .where(sql`${patients.id} = ANY(${ids})`);
      });
    }
  );
  
  return {
    patients: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Patient search with full-text search capabilities
export const searchPatients = async (
  query: string,
  limit: number = 10
): Promise<{
  patients: PatientSummary[];
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const cacheKey = `patients:search:${query.toLowerCase()}:${safeLimit}`;
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.PATIENTS_LIST,
    async () => {
      return await withPerformanceLogging('searchPatients', async () => {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        
        let whereClause = sql`1=1`;
        
        if (searchTerms.length > 0) {
          const searchConditions = searchTerms.map(term => 
            or(
              ilike(patients.name, `%${term}%`),
              ilike(patients.cpf, `%${term}%`),
              ilike(patients.email, `%${term}%`),
              ilike(patients.phone, `%${term}%`)
            )
          );
          
          whereClause = and(...searchConditions);
        }
        
        return await db.select({
          id: patients.id,
          name: patients.name,
          email: patients.email,
          phone: patients.phone,
          status: patients.status,
          lastVisit: patients.lastVisit,
          avatarUrl: patients.avatarUrl,
          medicalAlerts: patients.medicalAlerts,
        })
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.lastVisit))
        .limit(safeLimit);
      });
    }
  );
  
  return {
    patients: data,
    cacheHit,
    queryDuration: duration,
  };
};

// Patient statistics for dashboard
export const getPatientStats = async (): Promise<{
  stats: {
    total: number;
    active: number;
    inactive: number;
    discharged: number;
    newThisMonth: number;
  };
  cacheHit: boolean;
  queryDuration: number;
}> => {
  const cacheKey = 'patients:stats';
  
  const { data, cacheHit, duration } = await cacheQuery(
    cacheKey,
    CACHE_TTL.DASHBOARD_STATS,
    async () => {
      return await withPerformanceLogging('getPatientStats', async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const monthStart = startOfMonth.toISOString().split('T')[0];
        
        // Single aggregation query instead of multiple queries
        const result = await db.select({
          total: count(),
          active: count(sql`CASE WHEN ${patients.status} = 'Active' THEN 1 END`),
          inactive: count(sql`CASE WHEN ${patients.status} = 'Inactive' THEN 1 END`),
          discharged: count(sql`CASE WHEN ${patients.status} = 'Discharged' THEN 1 END`),
          newThisMonth: count(sql`CASE WHEN ${patients.registrationDate} >= ${monthStart} THEN 1 END`),
        })
        .from(patients);
        
        return result[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          discharged: 0,
          newThisMonth: 0,
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

// Legacy compatibility - gradually migrate to new functions
export const getAllPatients = async (): Promise<Patient[]> => {
  const { patients: patientsData } = await getPatients({ limit: 100 });
  return patientsData as Patient[]; // Type assertion for compatibility
};

// Health check for patient service
export const patientServiceHealthCheck = async () => {
  try {
    const start = Date.now();
    await db.select({ count: count() }).from(patients).limit(1);
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration,
      service: 'patient',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'patient',
    };
  }
};
