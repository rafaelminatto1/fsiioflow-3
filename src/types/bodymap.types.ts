// types/bodymap.types.ts
// Tipos TypeScript para o sistema de mapa corporal

import { PainPoint as PrismaPainPoint, BodyPart, Side } from '@prisma/client';

// ======================================
// CORE TYPES
// ======================================

export interface PainPoint {
  id: string;
  patientId: string;
  x: number; // 0-100 (porcentagem do SVG)
  y: number; // 0-100 (porcentagem do SVG)
  intensity: number; // 0-10
  bodyPart: BodyPart;
  side: Side;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BodyMapProps {
  patientId: string;
  readonly?: boolean;
  onPainPointAdd?: (point: Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onPainPointUpdate?: (id: string, updates: Partial<PainPoint>) => void;
  onPainPointDelete?: (id: string) => void;
  className?: string;
}

export interface BodyMapSVGProps {
  side: Side;
  painPoints: PainPoint[];
  onSVGClick: (x: number, y: number) => void;
  onPainPointClick: (point: PainPoint) => void;
  readonly?: boolean;
  className?: string;
}

export interface AddPainPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (point: Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialPosition: { x: number; y: number };
  side: Side;
  patientId: string;
}

export interface PainTimelineProps {
  patientId: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

// ======================================
// HOOK TYPES
// ======================================

export interface UseBodyMapReturn {
  painPoints: PainPoint[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addPainPoint: (point: Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PainPoint>;
  updatePainPoint: (id: string, updates: Partial<PainPoint>) => Promise<PainPoint>;
  deletePainPoint: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseBodyMapOptions {
  patientId: string;
  initialDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number; // em milissegundos
}

// ======================================
// ANALYTICS TYPES
// ======================================

export interface BodyMapAnalytics {
  // Métricas básicas
  totalPainPoints: number;
  averagePainIntensity: number;
  mostAffectedBodyParts: { bodyPart: BodyPart; count: number; avgIntensity: number }[];
  
  // Tendências temporais
  painTrend: 'improving' | 'worsening' | 'stable';
  weeklyPainAverage: number[];
  monthlyComparison: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  
  // Padrões e insights
  commonPainPatterns: PainPattern[];
  recoveryTime: number; // dias médios
  sessionEffectiveness: number; // 0-100%
  
  // Predições
  riskFactors: RiskFactor[];
  improvementPrediction: ImprovementPrediction;
}

export interface PainPattern {
  id: string;
  name: string;
  description: string;
  bodyParts: BodyPart[];
  frequency: number; // vezes que ocorreu
  averageIntensity: number;
  timePattern: 'morning' | 'afternoon' | 'evening' | 'night' | 'random';
  duration: number; // dias médios de duração
}

export interface RiskFactor {
  type: 'high_pain_increase' | 'long_duration' | 'multiple_areas' | 'no_improvement';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface ImprovementPrediction {
  expectedDays: number;
  confidence: number; // 0-100%
  factors: string[];
  recommendations: string[];
}

// ======================================
// SERVICE TYPES
// ======================================

export interface BodyMapServiceInterface {
  getPainPoints(patientId: string, date?: Date): Promise<PainPoint[]>;
  createPainPoint(point: Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<PainPoint>;
  updatePainPoint(id: string, updates: Partial<PainPoint>): Promise<PainPoint>;
  deletePainPoint(id: string): Promise<void>;
  getPainPointHistory(patientId: string, days?: number): Promise<PainPoint[]>;
  getAnalytics(patientId: string): Promise<BodyMapAnalytics>;
  exportToPDF(patientId: string, options?: ExportOptions): Promise<Blob>;
}

export interface ExportOptions {
  includeAnalytics?: boolean;
  includeTimeline?: boolean;
  includeImages?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format?: 'pdf' | 'png' | 'json';
}

// ======================================
// RESPONSE TYPES
// ======================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export type PainPointsResponse = ApiResponse<PainPoint[]>;
export type PainPointResponse = ApiResponse<PainPoint>;
export type AnalyticsResponse = ApiResponse<BodyMapAnalytics>;

// ======================================
// EVENT TYPES
// ======================================

export interface BodyMapEvent {
  type: 'pain_point_added' | 'pain_point_updated' | 'pain_point_deleted' | 'view_changed';
  timestamp: Date;
  data: any;
}

export interface PainPointAddedEvent extends BodyMapEvent {
  type: 'pain_point_added';
  data: {
    painPoint: PainPoint;
    patientId: string;
  };
}

export interface PainPointUpdatedEvent extends BodyMapEvent {
  type: 'pain_point_updated';
  data: {
    painPoint: PainPoint;
    previousValues: Partial<PainPoint>;
    patientId: string;
  };
}

export interface ViewChangedEvent extends BodyMapEvent {
  type: 'view_changed';
  data: {
    newSide: Side;
    previousSide: Side;
    patientId: string;
  };
}

// ======================================
// CONFIGURATION TYPES
// ======================================

export interface BodyMapConfig {
  // UI Configuration
  colors: {
    painScale: string[]; // Array de 11 cores (0-10)
    background: string;
    stroke: string;
    hover: string;
  };
  
  // Behavior Configuration
  clickToAdd: boolean;
  doubleClickToEdit: boolean;
  dragToMove: boolean;
  touchSupport: boolean;
  
  // Export Configuration
  defaultExportOptions: ExportOptions;
  
  // Analytics Configuration
  enableAnalytics: boolean;
  enablePredictions: boolean;
  refreshInterval: number;
}

// ======================================
// VALIDATION TYPES
// ======================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PainPointValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// ======================================
// UTILITY TYPES
// ======================================

export type PainPointInput = Omit<PainPoint, 'id' | 'createdAt' | 'updatedAt'>;
export type PainPointUpdate = Partial<Omit<PainPoint, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>>;

export type BodyMapMode = 'view' | 'edit' | 'readonly';
export type PainIntensity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ======================================
// CHART TYPES (para gráficos e timeline)
// ======================================

export interface ChartDataPoint {
  date: string;
  intensity: number;
  count: number;
  bodyPart?: BodyPart;
}

export interface TimelineData {
  points: ChartDataPoint[];
  summary: {
    totalPoints: number;
    averageIntensity: number;
    trend: 'improving' | 'worsening' | 'stable';
  };
}

// ======================================
// MOBILE/RESPONSIVE TYPES
// ======================================

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig {
  screenSize: ScreenSize;
  svgWidth: number;
  svgHeight: number;
  showSidebar: boolean;
  collapsibleControls: boolean;
}

// ======================================
// ACCESSIBILITY TYPES
// ======================================

export interface AccessibilityOptions {
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  colorBlindFriendly: boolean;
}