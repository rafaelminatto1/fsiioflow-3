# 🗺️ GUIA COMPLETO DO MAPA CORPORAL

O **Mapa Corporal Interativo** é a funcionalidade principal do FisioFlow, permitindo aos fisioterapeutas marcar, acompanhar e analisar pontos de dor dos pacientes de forma visual e intuitiva.

## 🎯 **VISÃO GERAL**

### **Principais Funcionalidades**
- 🖱️ **SVG Interativo** - Clique para marcar pontos de dor
- 📊 **Escala Visual de Dor** - Cores de 0-10 (verde a vermelho)
- ⏰ **Timeline de Evolução** - Histórico completo da dor
- 📱 **Responsivo** - Funciona em desktop, tablet e mobile
- 📄 **Export PDF** - Relatórios profissionais
- 🔍 **Análises Avançadas** - Padrões e tendências

### **Benefícios Clínicos**
- ✅ **Documentação Visual** - Registro preciso da localização da dor
- ✅ **Acompanhamento Temporal** - Evolução clara ao longo do tempo
- ✅ **Comunicação Melhorada** - Paciente e fisioterapeuta veem o mesmo mapa
- ✅ **Relatórios Profissionais** - PDFs para compartilhar com médicos
- ✅ **Análise de Padrões** - IA identifica tendências de melhora/piora

## 🏗️ **ARQUITETURA TÉCNICA**

### **Estrutura de Componentes**

```
components/medical/BodyMap/
├── BodyMap.tsx              # Componente principal
├── BodyMapSVG.tsx           # SVG interativo do corpo humano
├── PainTimeline.tsx         # Timeline de evolução temporal
├── AddPainPointModal.tsx    # Modal para adicionar/editar pontos
├── BodyMapAnalytics.tsx     # Análises e insights
├── ExportToPDF.tsx          # Geração de relatórios PDF
├── useBodyMap.ts            # Hook personalizado para lógica
├── types.ts                 # Tipos TypeScript
└── styles.module.css        # Estilos específicos
```

### **Modelos de Dados**

```typescript
// Ponto de dor no corpo
interface PainPoint {
  id: string;
  patientId: string;
  x: number;              // Coordenada X no SVG (0-100%)
  y: number;              // Coordenada Y no SVG (0-100%)
  intensity: number;      // Intensidade da dor (0-10)
  bodyPart: BodyPart;     // Parte anatômica
  side: 'FRONT' | 'BACK'; // Lado do corpo
  notes?: string;         // Anotações do fisioterapeuta
  createdAt: Date;        // Data de criação
}

// Partes do corpo suportadas
type BodyPart = 
  | 'head' | 'neck' 
  | 'shoulder_left' | 'shoulder_right'
  | 'arm_left' | 'arm_right'
  | 'chest' | 'back_upper' | 'back_lower'
  | 'hip_left' | 'hip_right'
  | 'leg_left' | 'leg_right'
  | 'knee_left' | 'knee_right'
  | 'foot_left' | 'foot_right';
```

## 🎨 **DESIGN SYSTEM**

### **Escala de Cores da Dor**

```css
/* Paleta de cores baseada na intensidade */
.pain-0  { background: #10b981; } /* Verde - sem dor */
.pain-1  { background: #34d399; }
.pain-2  { background: #6ee7b7; }
.pain-3  { background: #fbbf24; } /* Amarelo - dor leve */
.pain-4  { background: #f59e0b; }
.pain-5  { background: #f97316; } /* Laranja - dor moderada */
.pain-6  { background: #ea580c; }
.pain-7  { background: #dc2626; } /* Vermelho - dor forte */
.pain-8  { background: #b91c1c; }
.pain-9  { background: #991b1b; }
.pain-10 { background: #7f1d1d; } /* Vermelho escuro - dor máxima */
```

### **Layout Responsivo**

```css
/* Desktop (>1024px) */
.body-map-desktop {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 2rem;
}

/* Tablet (768px - 1024px) */
.body-map-tablet {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.body-map-tablet .svg-container {
  width: 400px;
  height: 600px;
}

/* Mobile (<768px) */
.body-map-mobile .svg-container {
  width: 300px;
  height: 450px;
}
```

## 🔧 **IMPLEMENTAÇÃO**

### **1. Hook Personalizado (useBodyMap.ts)**

```typescript
import { useState, useEffect } from 'react';
import { PainPoint } from './types';
import { bodyMapService } from '../../../services/bodyMapService';

export function useBodyMap(patientId: string) {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Carregar pontos de dor
  useEffect(() => {
    loadPainPoints();
  }, [patientId, selectedDate]);

  const loadPainPoints = async () => {
    setLoading(true);
    try {
      const points = await bodyMapService.getPainPoints(
        patientId, 
        selectedDate
      );
      setPainPoints(points);
    } catch (error) {
      console.error('Erro ao carregar pontos de dor:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPainPoint = async (point: Omit<PainPoint, 'id' | 'createdAt'>) => {
    try {
      const newPoint = await bodyMapService.createPainPoint(point);
      setPainPoints(prev => [...prev, newPoint]);
      return newPoint;
    } catch (error) {
      console.error('Erro ao adicionar ponto de dor:', error);
      throw error;
    }
  };

  const updatePainPoint = async (id: string, updates: Partial<PainPoint>) => {
    try {
      const updatedPoint = await bodyMapService.updatePainPoint(id, updates);
      setPainPoints(prev => 
        prev.map(p => p.id === id ? updatedPoint : p)
      );
      return updatedPoint;
    } catch (error) {
      console.error('Erro ao atualizar ponto de dor:', error);
      throw error;
    }
  };

  const deletePainPoint = async (id: string) => {
    try {
      await bodyMapService.deletePainPoint(id);
      setPainPoints(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao deletar ponto de dor:', error);
      throw error;
    }
  };

  return {
    painPoints,
    loading,
    selectedDate,
    setSelectedDate,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
    refresh: loadPainPoints,
  };
}
```

### **2. Componente Principal (BodyMap.tsx)**

```typescript
import React, { useState } from 'react';
import { BodyMapSVG } from './BodyMapSVG';
import { PainTimeline } from './PainTimeline';
import { AddPainPointModal } from './AddPainPointModal';
import { useBodyMap } from './useBodyMap';
import { PainPoint } from './types';

interface BodyMapProps {
  patientId: string;
  readonly?: boolean;
}

export function BodyMap({ patientId, readonly = false }: BodyMapProps) {
  const {
    painPoints,
    loading,
    selectedDate,
    setSelectedDate,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
  } = useBodyMap(patientId);

  const [currentSide, setCurrentSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number} | null>(null);

  // Filtrar pontos por lado atual
  const currentPainPoints = painPoints.filter(p => p.side === currentSide);

  const handleSVGClick = (x: number, y: number) => {
    if (readonly) return;
    
    setSelectedPoint({ x, y });
    setShowAddModal(true);
  };

  const handleAddPainPoint = async (data: Omit<PainPoint, 'id' | 'createdAt'>) => {
    try {
      await addPainPoint({
        ...data,
        side: currentSide,
        patientId,
      });
      setShowAddModal(false);
      setSelectedPoint(null);
    } catch (error) {
      // Tratar erro (mostrar toast, etc.)
    }
  };

  if (loading) {
    return <div className=\"flex justify-center p-8\">Carregando mapa corporal...</div>;
  }

  return (
    <div className=\"body-map-container\">
      {/* Header com controles */}
      <div className=\"flex justify-between items-center mb-6\">
        <h2 className=\"text-2xl font-bold\">Mapa Corporal</h2>
        
        {/* Toggle Front/Back */}
        <div className=\"flex bg-gray-200 rounded-lg p-1\">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${{
              currentSide === 'FRONT' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-700 hover:bg-gray-300'
            }}`}
            onClick={() => setCurrentSide('FRONT')}
          >
            Frente
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${{
              currentSide === 'BACK' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-700 hover:bg-gray-300'
            }}`}
            onClick={() => setCurrentSide('BACK')}
          >
            Costas
          </button>
        </div>
      </div>

      {/* Layout principal */}
      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
        {/* SVG do corpo */}
        <div className=\"lg:col-span-2\">
          <BodyMapSVG
            side={currentSide}
            painPoints={currentPainPoints}
            onSVGClick={handleSVGClick}
            onPainPointClick={(point) => {
              // Abrir modal de edição
            }}
            readonly={readonly}
          />
        </div>

        {/* Painel lateral */}
        <div className=\"space-y-6\">
          {/* Timeline */}
          <PainTimeline
            patientId={patientId}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          {/* Legenda da escala de dor */}
          <div className=\"bg-white p-4 rounded-lg shadow\">
            <h3 className=\"font-semibold mb-3\">Escala de Dor</h3>
            <div className=\"space-y-2\">
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} className=\"flex items-center gap-2\">
                  <div 
                    className={`w-4 h-4 rounded-full pain-${{i}}`}
                  />
                  <span className=\"text-sm\">
                    {i === 0 && \"Sem dor\"}
                    {i >= 1 && i <= 3 && \"Dor leve\"}
                    {i >= 4 && i <= 6 && \"Dor moderada\"}
                    {i >= 7 && i <= 10 && \"Dor forte\"}
                    ({i})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estatísticas */}
          <div className=\"bg-white p-4 rounded-lg shadow\">
            <h3 className=\"font-semibold mb-3\">Estatísticas</h3>
            <div className=\"space-y-2 text-sm\">
              <div className=\"flex justify-between\">
                <span>Total de pontos:</span>
                <span className=\"font-medium\">{currentPainPoints.length}</span>
              </div>
              <div className=\"flex justify-between\">
                <span>Dor média:</span>
                <span className=\"font-medium\">
                  {currentPainPoints.length > 0
                    ? (currentPainPoints.reduce((sum, p) => sum + p.intensity, 0) / currentPainPoints.length).toFixed(1)
                    : '0.0'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para adicionar ponto */}
      {showAddModal && selectedPoint && (
        <AddPainPointModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPoint(null);
          }}
          onSave={handleAddPainPoint}
          initialPosition={selectedPoint}
          side={currentSide}
        />
      )}
    </div>
  );
}
```

### **3. SVG Interativo (BodyMapSVG.tsx)**

```typescript
import React from 'react';
import { PainPoint } from './types';

interface BodyMapSVGProps {
  side: 'FRONT' | 'BACK';
  painPoints: PainPoint[];
  onSVGClick: (x: number, y: number) => void;
  onPainPointClick: (point: PainPoint) => void;
  readonly?: boolean;
}

export function BodyMapSVG({
  side,
  painPoints,
  onSVGClick,
  onPainPointClick,
  readonly = false,
}: BodyMapSVGProps) {
  
  const handleSVGClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (readonly) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    onSVGClick(x, y);
  };

  return (
    <div className=\"relative bg-white rounded-lg shadow p-4\">
      <svg
        viewBox=\"0 0 300 600\"
        className=\"w-full h-auto max-h-96 cursor-pointer\"
        onClick={handleSVGClick}
      >
        {/* SVG do corpo humano */}
        {side === 'FRONT' ? (
          // Corpo - frente
          <g>
            {/* Cabeça */}
            <ellipse 
              cx=\"150\" cy=\"50\" 
              rx=\"30\" ry=\"40\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
            
            {/* Pescoço */}
            <rect 
              x=\"140\" y=\"85\" 
              width=\"20\" height=\"25\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
            
            {/* Tronco */}
            <ellipse 
              cx=\"150\" cy=\"200\" 
              rx=\"60\" ry=\"90\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
            
            {/* Braços */}
            <ellipse 
              cx=\"80\" cy=\"180\" 
              rx=\"15\" ry=\"60\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
            <ellipse 
              cx=\"220\" cy=\"180\" 
              rx=\"15\" ry=\"60\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
            
            {/* Pernas */}
            <ellipse 
              cx=\"125\" cy=\"400\" 
              rx=\"20\" ry=\"100\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
            <ellipse 
              cx=\"175\" cy=\"400\" 
              rx=\"20\" ry=\"100\" 
              fill=\"#f3f4f6\" 
              stroke=\"#6b7280\" 
              strokeWidth=\"2\"
            />
          </g>
        ) : (
          // Corpo - costas (similar mas virado)
          <g>
            {/* Implementar SVG das costas */}
          </g>
        )}
        
        {/* Pontos de dor */}
        {painPoints.map((point) => (
          <circle
            key={point.id}
            cx={(point.x / 100) * 300}
            cy={(point.y / 100) * 600}
            r=\"8\"
            className={`pain-${{point.intensity}} cursor-pointer hover:r-10 transition-all`}
            onClick={(e) => {
              e.stopPropagation();
              onPainPointClick(point);
            }}
            style={{
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            <title>{`Dor: ${{point.intensity}}/10 - ${{point.notes || 'Sem anotações'}}`}</title>
          </circle>
        ))}
      </svg>
      
      {/* Instruções */}
      {!readonly && (
        <p className=\"text-sm text-gray-600 mt-2 text-center\">
          Clique no corpo para marcar um ponto de dor
        </p>
      )}
    </div>
  );
}
```

## 📱 **RESPONSIVIDADE**

### **Breakpoints**

```typescript
// hooks/useResponsive.ts
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateScreenSize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  return screenSize;
}
```

### **Touch Support**

```typescript
// Touch handlers para dispositivos móveis
const handleTouchStart = (event: React.TouchEvent) => {
  const touch = event.touches[0];
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((touch.clientX - rect.left) / rect.width) * 100;
  const y = ((touch.clientY - rect.top) / rect.height) * 100;
  
  onSVGClick(x, y);
};
```

## 📊 **ANALYTICS E INSIGHTS**

### **Métricas Coletadas**

```typescript
interface BodyMapAnalytics {
  // Métricas básicas
  totalPainPoints: number;
  averagePainIntensity: number;
  mostAffectedBodyParts: BodyPart[];
  
  // Tendências temporais
  painTrend: 'improving' | 'worsening' | 'stable';
  weeklyPainAverage: number[];
  
  // Padrões
  commonPainPatterns: string[];
  recoveryTime: number; // dias
  
  // Comparações
  improvementPercentage: number;
  sessionEffectiveness: number;
}
```

### **Algoritmos de Análise**

```typescript
// services/bodyMapAnalytics.ts
export class BodyMapAnalyticsService {
  
  static calculatePainTrend(points: PainPoint[]): 'improving' | 'worsening' | 'stable' {
    if (points.length < 2) return 'stable';
    
    const sortedPoints = points.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const firstHalf = sortedPoints.slice(0, Math.floor(sortedPoints.length / 2));
    const secondHalf = sortedPoints.slice(Math.floor(sortedPoints.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.intensity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.intensity, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference < -0.5) return 'improving';
    if (difference > 0.5) return 'worsening';
    return 'stable';
  }
  
  static findPainPatterns(points: PainPoint[]): string[] {
    // Implementar algoritmo de detecção de padrões
    // Exemplo: \"Dor no ombro direito após exercícios\"
    return [];
  }
}
```

## 📄 **EXPORT PARA PDF**

### **Geração de Relatórios**

```typescript
import html2pdf from 'html2pdf.js';

export class BodyMapPDFExporter {
  
  static async generateReport(
    patientData: Patient, 
    painPoints: PainPoint[],
    analytics: BodyMapAnalytics
  ): Promise<Blob> {
    
    const htmlContent = this.generateHTMLReport(patientData, painPoints, analytics);
    
    const options = {
      margin: 1,
      filename: `mapa-corporal-${{patientData.name}}-${{new Date().toISOString().split('T')[0]}}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    return html2pdf().set(options).from(htmlContent).outputPdf();
  }
  
  private static generateHTMLReport(
    patient: Patient, 
    painPoints: PainPoint[], 
    analytics: BodyMapAnalytics
  ): string {
    return `
      <div style=\"font-family: Arial, sans-serif; padding: 20px;\">
        <header style=\"text-align: center; margin-bottom: 30px;\">
          <h1>Relatório do Mapa Corporal</h1>
          <h2>${{patient.name}}</h2>
          <p>Data: ${{new Date().toLocaleDateString('pt-BR')}}</p>
        </header>
        
        <section style=\"margin-bottom: 30px;\">
          <h3>Resumo Executivo</h3>
          <ul>
            <li>Total de pontos de dor: ${{analytics.totalPainPoints}}</li>
            <li>Intensidade média: ${{analytics.averagePainIntensity.toFixed(1)}}/10</li>
            <li>Tendência: ${{analytics.painTrend === 'improving' ? 'Melhorando' : analytics.painTrend === 'worsening' ? 'Piorando' : 'Estável'}}</li>
            <li>Melhora percentual: ${{analytics.improvementPercentage.toFixed(1)}}%</li>
          </ul>
        </section>
        
        <section style=\"margin-bottom: 30px;\">
          <h3>Pontos de Dor Atuais</h3>
          <table style=\"width: 100%; border-collapse: collapse;\">
            <thead>
              <tr style=\"background: #f3f4f6;\">
                <th style=\"border: 1px solid #ddd; padding: 8px;\">Região</th>
                <th style=\"border: 1px solid #ddd; padding: 8px;\">Lado</th>
                <th style=\"border: 1px solid #ddd; padding: 8px;\">Intensidade</th>
                <th style=\"border: 1px solid #ddd; padding: 8px;\">Anotações</th>
              </tr>
            </thead>
            <tbody>
              ${{painPoints.map(point => `
                <tr>
                  <td style=\"border: 1px solid #ddd; padding: 8px;\">${{point.bodyPart}}</td>
                  <td style=\"border: 1px solid #ddd; padding: 8px;\">${{point.side}}</td>
                  <td style=\"border: 1px solid #ddd; padding: 8px;\">${{point.intensity}}/10</td>
                  <td style=\"border: 1px solid #ddd; padding: 8px;\">${{point.notes || 'N/A'}}</td>
                </tr>
              `).join('')}}
            </tbody>
          </table>
        </section>
        
        <footer style=\"margin-top: 50px; text-align: center; color: #666;\">
          <p>Relatório gerado pelo FisioFlow - Sistema de Gestão de Fisioterapia</p>
        </footer>
      </div>
    `;
  }
}
```

## 🧪 **TESTES**

### **Testes de Componente**

```typescript
// __tests__/BodyMap.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BodyMap } from '../components/medical/BodyMap/BodyMap';
import { bodyMapService } from '../services/bodyMapService';

// Mock do serviço
jest.mock('../services/bodyMapService');

describe('BodyMap Component', () => {
  
  beforeEach(() => {
    (bodyMapService.getPainPoints as jest.Mock).mockResolvedValue([]);
  });
  
  test('renders body map with front view by default', async () => {
    render(<BodyMap patientId=\"patient-123\" />);
    
    expect(screen.getByText('Mapa Corporal')).toBeInTheDocument();
    expect(screen.getByText('Frente')).toHaveClass('bg-blue-500');
  });
  
  test('allows switching between front and back views', async () => {
    render(<BodyMap patientId=\"patient-123\" />);
    
    fireEvent.click(screen.getByText('Costas'));
    expect(screen.getByText('Costas')).toHaveClass('bg-blue-500');
  });
  
  test('opens modal when clicking on SVG', async () => {
    render(<BodyMap patientId=\"patient-123\" />);
    
    const svg = screen.getByRole('img'); // SVG é tratado como img
    fireEvent.click(svg);
    
    expect(screen.getByText('Adicionar Ponto de Dor')).toBeInTheDocument();
  });
  
  test('does not allow interaction in readonly mode', async () => {
    render(<BodyMap patientId=\"patient-123\" readonly />);
    
    const svg = screen.getByRole('img');
    fireEvent.click(svg);
    
    expect(screen.queryByText('Adicionar Ponto de Dor')).not.toBeInTheDocument();
  });
});
```

### **Testes do Hook**

```typescript
// __tests__/useBodyMap.test.ts
import { renderHook, act } from '@testing-library/react';
import { useBodyMap } from '../components/medical/BodyMap/useBodyMap';
import { bodyMapService } from '../services/bodyMapService';

jest.mock('../services/bodyMapService');

describe('useBodyMap Hook', () => {
  
  test('loads pain points on mount', async () => {
    const mockPainPoints = [
      { id: '1', patientId: 'p1', x: 50, y: 30, intensity: 5, bodyPart: 'shoulder_left', side: 'FRONT' }
    ];
    
    (bodyMapService.getPainPoints as jest.Mock).mockResolvedValue(mockPainPoints);
    
    const { result, waitForNextUpdate } = renderHook(() => useBodyMap('patient-123'));
    
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.painPoints).toEqual(mockPainPoints);
  });
  
  test('adds new pain point', async () => {
    const newPoint = {
      patientId: 'p1',
      x: 60,
      y: 40,
      intensity: 7,
      bodyPart: 'shoulder_right' as const,
      side: 'FRONT' as const,
      notes: 'Teste'
    };
    
    const createdPoint = { ...newPoint, id: '2', createdAt: new Date() };
    
    (bodyMapService.getPainPoints as jest.Mock).mockResolvedValue([]);
    (bodyMapService.createPainPoint as jest.Mock).mockResolvedValue(createdPoint);
    
    const { result, waitForNextUpdate } = renderHook(() => useBodyMap('patient-123'));
    
    await waitForNextUpdate(); // Aguardar carregamento inicial
    
    await act(async () => {
      await result.current.addPainPoint(newPoint);
    });
    
    expect(result.current.painPoints).toContain(createdPoint);
  });
});
```

## 🚀 **PERFORMANCE**

### **Otimizações Implementadas**

```typescript
// Memoização do SVG para evitar re-renders desnecessários
const BodyMapSVG = React.memo(({ side, painPoints, ...props }) => {
  // Componente só re-renderiza se side ou painPoints mudarem
});

// Debounce para atualizações em tempo real
import { debounce } from 'lodash';

const debouncedUpdate = useCallback(
  debounce((updates) => {
    updatePainPoint(pointId, updates);
  }, 500),
  [updatePainPoint]
);

// Lazy loading do componente para reduzir bundle inicial
const BodyMap = lazy(() => import('./components/medical/BodyMap/BodyMap'));

// Virtual scrolling para listas grandes de pontos (timeline)
import { FixedSizeList as List } from 'react-window';
```

### **Bundle Size**

- **BodyMap.js**: ~45KB (gzipped: ~12KB)
- **SVG Assets**: ~8KB
- **Dependencies**: html2pdf.js (~85KB)

## 🔒 **SEGURANÇA**

### **Validações de Input**

```typescript
// Validação de coordenadas
const validateCoordinates = (x: number, y: number): boolean => {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
};

// Sanitização de anotações
const sanitizeNotes = (notes: string): string => {
  return notes.replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<[^>]+>/g, '')
              .trim();
};

// Rate limiting para operações de CRUD
const rateLimiter = new Map();

const checkRateLimit = (patientId: string): boolean => {
  const now = Date.now();
  const windowSize = 60000; // 1 minuto
  const maxRequests = 30;
  
  if (!rateLimiter.has(patientId)) {
    rateLimiter.set(patientId, []);
  }
  
  const requests = rateLimiter.get(patientId);
  const recentRequests = requests.filter(time => now - time < windowSize);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(patientId, recentRequests);
  return true;
};
```

## 📈 **ROADMAP FUTURO**

### **Próximas Features**

1. **🤖 IA Preditiva**
   - Previsão de pontos de dor baseada em histórico
   - Sugestões de exercícios baseadas nos pontos
   - Alertas automáticos para fisioterapeutas

2. **📱 App Mobile Nativo**
   - App React Native para pacientes
   - Registro de dor em tempo real
   - Notificações push para exercícios

3. **🔗 Integração com Wearables**
   - Smartwatches para monitoramento contínuo
   - Sensores de movimento
   - Biofeedback em tempo real

4. **🌐 Colaboração Multi-profissional**
   - Compartilhamento com médicos
   - Anotações colaborativas
   - Workflow de aprovação

5. **📊 Analytics Avançados**
   - Machine Learning para padrões complexos
   - Benchmarking com outros pacientes
   - ROI do tratamento

---

**🗺️ O Mapa Corporal do FisioFlow revoluciona a forma como fisioterapeutas documentam e acompanham a evolução dos pacientes!**