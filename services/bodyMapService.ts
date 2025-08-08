import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../lib/database';
import {
  bodyMapEvolutions,
  bodyMapRegions,
  patients,
  regionHistories,
  type BodyMapEvolution,
  type BodyMapRegion,
  type RegionHistory,
  type NewBodyMapEvolution,
  type NewBodyMapRegion,
} from '../lib/schema';

export type SymptomType =
  | 'dor_aguda'
  | 'dor_cronica'
  | 'limitacao_movimento'
  | 'edema'
  | 'parestesia'
  | 'fraqueza_muscular'
  | 'instabilidade'
  | 'contratura'
  | 'trigger_points';

export type Frequency = 'constante' | 'intermitente' | 'ao_movimento' | 'em_reposo' | 'noturna';

export type Side = 'direito' | 'esquerdo' | 'bilateral';

export interface RegionInput {
  regionCode: string;
  regionName: string;
  anatomicalGroup: string;
  side?: Side;
  symptomType: SymptomType[];
  painIntensity: number; // 0-10
  painCharacteristic: string[];
  frequency: Frequency;
  onsetDate: string | Date;
  firstReportDate: string | Date;
  mechanism?: string;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  irradiationTo?: string[];
  isActive?: boolean;
  isImproved?: boolean;
  improvementPercentage?: number | null;
  romLimitation?: Record<string, unknown> | null;
  muscleStrength?: number | null; // 0-5
  specialTests?: Record<string, unknown> | null;
}

export interface CreateEvolutionInput {
  patientId: string;
  appointmentId?: string;
  soapNoteId?: string;
  generalNotes?: string;
  regions: RegionInput[];
}

export interface GetEvolutionsParams {
  patientId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export async function getLatestEvolution(patientId: string): Promise<BodyMapEvolution & { regions: BodyMapRegion[] } | null> {
  const evolutions = await db
    .select()
    .from(bodyMapEvolutions)
    .where(eq(bodyMapEvolutions.patientId, patientId))
    .orderBy(desc(bodyMapEvolutions.createdAt))
    .limit(1);

  if (evolutions.length === 0) return null;
  const evolution = evolutions[0];
  const regions = await db
    .select()
    .from(bodyMapRegions)
    .where(eq(bodyMapRegions.bodyMapEvolutionId, evolution.id));
  return { ...evolution, regions } as unknown as BodyMapEvolution & { regions: BodyMapRegion[] };
}

export async function getEvolutions(params: GetEvolutionsParams): Promise<Array<BodyMapEvolution & { regions: BodyMapRegion[] }>> {
  const { patientId, startDate, endDate, limit = 20 } = params;

  const conditions = [eq(bodyMapEvolutions.patientId, patientId)];
  if (startDate) conditions.push(gte(bodyMapEvolutions.createdAt, startDate));
  if (endDate) conditions.push(lte(bodyMapEvolutions.createdAt, endDate));

  const evolutions = await db
    .select()
    .from(bodyMapEvolutions)
    .where(and(...conditions))
    .orderBy(desc(bodyMapEvolutions.createdAt))
    .limit(limit);

  const results: Array<BodyMapEvolution & { regions: BodyMapRegion[] }> = [];
  for (const ev of evolutions) {
    const regions = await db
      .select()
      .from(bodyMapRegions)
      .where(eq(bodyMapRegions.bodyMapEvolutionId, ev.id));
    results.push({ ...ev, regions } as unknown as BodyMapEvolution & { regions: BodyMapRegion[] });
  }
  return results;
}

export async function createEvolution(input: CreateEvolutionInput): Promise<{ evolution: BodyMapEvolution; regions: BodyMapRegion[] }>
{
  const now = new Date();
  const [evolution] = await db.insert(bodyMapEvolutions).values({
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    soapNoteId: input.soapNoteId,
    generalNotes: input.generalNotes ?? null,
    createdAt: now,
    updatedAt: now,
  } satisfies NewBodyMapEvolution).returning();

  const regionValues: NewBodyMapRegion[] = input.regions.map(r => ({
    bodyMapEvolutionId: evolution.id,
    regionCode: r.regionCode,
    regionName: r.regionName,
    anatomicalGroup: r.anatomicalGroup,
    side: r.side ?? null,
    symptomType: r.symptomType,
    painIntensity: r.painIntensity,
    painCharacteristic: r.painCharacteristic,
    frequency: r.frequency,
    onsetDate: new Date(r.onsetDate),
    firstReportDate: new Date(r.firstReportDate),
    mechanism: r.mechanism ?? null,
    aggravatingFactors: r.aggravatingFactors ?? [],
    relievingFactors: r.relievingFactors ?? [],
    irradiationTo: r.irradiationTo ?? [],
    isActive: r.isActive ?? true,
    isImproved: r.isImproved ?? false,
    improvementPercentage: r.improvementPercentage ?? null,
    romLimitation: r.romLimitation ?? null,
    muscleStrength: r.muscleStrength ?? null,
    specialTests: r.specialTests ?? null,
  }));

  const insertedRegions = await db.insert(bodyMapRegions).values(regionValues).returning();

  // Update or insert region history aggregates
  await upsertRegionHistories(evolution.patientId, insertedRegions);

  return { evolution, regions: insertedRegions };
}

async function upsertRegionHistories(patientId: string, regions: BodyMapRegion[]): Promise<void> {
  for (const region of regions) {
    // Fetch existing history
    const existing = await db
      .select()
      .from(regionHistories)
      .where(and(eq(regionHistories.patientId, patientId), eq(regionHistories.regionCode, region.regionCode)));

    const treatmentDays = Math.max(0, Math.ceil((Date.now() - new Date(region.onsetDate).getTime()) / (1000 * 60 * 60 * 24)));

    if (existing.length === 0) {
      await db.insert(regionHistories).values({
        patientId,
        regionCode: region.regionCode,
        totalTreatmentDays: treatmentDays,
        sessionsCount: 1,
        averageIntensity: String(region.painIntensity),
        maxIntensity: region.painIntensity,
        minIntensity: region.painIntensity,
        firstOccurrence: region.firstReportDate,
        lastOccurrence: new Date(),
        resolutionDate: region.isActive ? null : new Date(),
        recurrences: 0,
      });
    } else {
      const h = existing[0];
      const newSessionsCount = h.sessionsCount + 1;
      const newAvg = ((Number(h.averageIntensity) * h.sessionsCount) + region.painIntensity) / newSessionsCount;
      const newMax = Math.max(h.maxIntensity, region.painIntensity);
      const newMin = h.minIntensity === 0 ? region.painIntensity : Math.min(h.minIntensity, region.painIntensity);
      const recurrences = region.isActive && h.resolutionDate ? h.recurrences + 1 : h.recurrences;

      await db.update(regionHistories)
        .set({
          sessionsCount: newSessionsCount,
          averageIntensity: String(newAvg.toFixed(2)),
          maxIntensity: newMax,
          minIntensity: newMin,
          lastOccurrence: new Date(),
          totalTreatmentDays: treatmentDays > h.totalTreatmentDays ? treatmentDays : h.totalTreatmentDays,
          resolutionDate: region.isActive ? null : (h.resolutionDate ?? null),
          recurrences,
        })
        .where(eq(regionHistories.id, h.id));
    }
  }
}

// Analytics
export const BodyMapAnalyticsService = {
  async getRegionTreatmentDuration(patientId: string, regionCode: string) {
    const h = await db
      .select()
      .from(regionHistories)
      .where(and(eq(regionHistories.patientId, patientId), eq(regionHistories.regionCode, regionCode)));
    if (h.length === 0) return 0;
    return h[0].totalTreatmentDays;
  },

  async getMostProblematicRegions(patientId: string) {
    const rows = await db
      .select()
      .from(regionHistories)
      .where(eq(regionHistories.patientId, patientId))
      .orderBy(desc(regionHistories.sessionsCount));
    return rows;
  },

  async getInjuryPatterns(patientId: string) {
    // Naive co-occurrence analysis per evolution
    const evolutions = await getEvolutions({ patientId, limit: 200 });
    const counts: Record<string, number> = {};
    for (const ev of evolutions) {
      const codes = Array.from(new Set(ev.regions.map(r => r.regionCode))).sort();
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          const key = `${codes[i]}|${codes[j]}`;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pair, count]) => ({ pair, count }));
  },

  async getProgressionAnalysis(patientId: string, regionCode: string) {
    // Return intensity over time (by evolution createdAt)
    const evolutions = await getEvolutions({ patientId, limit: 500 });
    const points: Array<{ date: Date; painIntensity: number }> = [];
    for (const ev of evolutions) {
      const region = ev.regions.find(r => r.regionCode === regionCode);
      if (region) points.push({ date: ev.createdAt, painIntensity: region.painIntensity });
    }
    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  async findCorrelations(patientId: string) {
    const evolutions = await getEvolutions({ patientId, limit: 200 });
    const freq: Record<string, number> = {};
    for (const ev of evolutions) {
      const codes = Array.from(new Set(ev.regions.map(r => r.regionCode)));
      for (const code of codes) freq[code] = (freq[code] ?? 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  },
};

export async function getRegionHistory(patientId: string): Promise<RegionHistory[]> {
  return db.select().from(regionHistories).where(eq(regionHistories.patientId, patientId));
}

// Helper to preselect previous regions for intelligent persistence
export async function getPresetFromLastEvolution(patientId: string): Promise<RegionInput[]> {
  const last = await getLatestEvolution(patientId);
  if (!last) return [];
  return last.regions.map(r => ({
    regionCode: r.regionCode,
    regionName: r.regionName,
    anatomicalGroup: r.anatomicalGroup,
    side: (r.side as Side | null) ?? undefined,
    symptomType: r.symptomType as SymptomType[],
    painIntensity: r.painIntensity,
    painCharacteristic: r.painCharacteristic as string[],
    frequency: r.frequency as Frequency,
    onsetDate: r.onsetDate,
    firstReportDate: r.firstReportDate,
    mechanism: r.mechanism ?? undefined,
    aggravatingFactors: (r.aggravatingFactors as string[]) ?? [],
    relievingFactors: (r.relievingFactors as string[]) ?? [],
    irradiationTo: (r.irradiationTo as string[]) ?? [],
    isActive: r.isActive,
    isImproved: r.isImproved,
    improvementPercentage: r.improvementPercentage ?? undefined,
    romLimitation: (r.romLimitation as Record<string, unknown> | null) ?? undefined,
    muscleStrength: r.muscleStrength ?? undefined,
    specialTests: (r.specialTests as Record<string, unknown> | null) ?? undefined,
  }));
}


