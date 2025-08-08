import React, { useMemo } from 'react';
import InteractiveBodyMap from '../InteractiveBodyMap';

interface HeatmapData {
  regionCode: string;
  frequency: number;
  averageIntensity: number;
  maxIntensity: number;
}

interface BodyMapHeatmapProps {
  data: HeatmapData[];
  dateRange: { start: string; end: string };
}

const BodyMapHeatmap: React.FC<BodyMapHeatmapProps> = ({ data, dateRange }) => {
  const heatmapColors = useMemo(() => {
    const colors: Record<string, string> = {};
    const maxFreq = Math.max(...data.map(d => d.frequency), 1);
    
    data.forEach(item => {
      const intensity = item.frequency / maxFreq;
      if (intensity <= 0.2) colors[item.regionCode] = '#fee2e2'; // red-100
      else if (intensity <= 0.4) colors[item.regionCode] = '#fecaca'; // red-200
      else if (intensity <= 0.6) colors[item.regionCode] = '#f87171'; // red-400
      else if (intensity <= 0.8) colors[item.regionCode] = '#ef4444'; // red-500
      else colors[item.regionCode] = '#dc2626'; // red-600
    });
    
    return colors;
  }, [data]);

  const selectedParts = data.map(d => d.regionCode);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Mapa de Calor - Frequência de Problemas</h3>
        <div className="text-sm text-slate-600">
          {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InteractiveBodyMap 
              selectedParts={selectedParts} 
              onSelectPart={() => {}} 
              highlights={[]}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Legenda de Intensidade</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border rounded"></div>
                  <span>Baixa (0-20%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border rounded"></div>
                  <span>Leve (20-40%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 border rounded"></div>
                  <span>Moderada (40-60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 border rounded"></div>
                  <span>Alta (60-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 border rounded"></div>
                  <span>Muito Alta (80-100%)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Regiões Mais Afetadas</h4>
              <div className="space-y-2">
                {data
                  .sort((a, b) => b.frequency - a.frequency)
                  .slice(0, 5)
                  .map(item => (
                    <div key={item.regionCode} className="flex justify-between text-xs">
                      <span className="text-slate-700">{item.regionCode}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{item.frequency}x</span>
                        <span className="text-slate-500">EVA {item.averageIntensity.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMapHeatmap;
