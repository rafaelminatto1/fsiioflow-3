import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  painEvolution: Array<{ date: string; averagePain: number; regionCount: number }>;
  regionFrequency: Array<{ region: string; frequency: number; averageIntensity: number }>;
  treatmentDuration: Array<{ region: string; days: number; sessions: number }>;
  improvementRate: Array<{ region: string; improved: number; total: number; rate: number }>;
}

interface BodyMapAnalyticsProps {
  data: AnalyticsData;
  patientName: string;
  dateRange: { start: string; end: string };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const BodyMapAnalytics: React.FC<BodyMapAnalyticsProps> = ({ data, patientName, dateRange }) => {
  const { painEvolution, regionFrequency, treatmentDuration, improvementRate } = data;

  const totalSessions = useMemo(() => {
    return painEvolution.length;
  }, [painEvolution]);

  const averagePainReduction = useMemo(() => {
    if (painEvolution.length < 2) return 0;
    const first = painEvolution[0].averagePain;
    const last = painEvolution[painEvolution.length - 1].averagePain;
    return ((first - last) / first * 100);
  }, [painEvolution]);

  const mostProblematicRegion = useMemo(() => {
    return regionFrequency.reduce((prev, current) => 
      (prev.frequency > current.frequency) ? prev : current, regionFrequency[0]
    );
  }, [regionFrequency]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Analytics - {patientName}</h2>
        <div className="text-sm text-slate-600">
          {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-sky-600">{totalSessions}</div>
          <div className="text-sm text-slate-600">Total de Sessões</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-emerald-600">
            {averagePainReduction > 0 ? `${averagePainReduction.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-sm text-slate-600">Redução da Dor</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-amber-600">{regionFrequency.length}</div>
          <div className="text-sm text-slate-600">Regiões Tratadas</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-rose-600">
            {mostProblematicRegion?.region.substring(0, 10) || 'N/A'}
          </div>
          <div className="text-sm text-slate-600">Região + Problemática</div>
        </div>
      </div>

      {/* Evolução da Dor ao Longo do Tempo */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolução da Dor ao Longo do Tempo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={painEvolution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Intensidade da Dor (EVA)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number, name: string) => [value.toFixed(1), name === 'averagePain' ? 'Dor Média' : 'Regiões Ativas']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="averagePain" 
              stroke="#ef4444" 
              strokeWidth={3}
              name="Dor Média"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="regionCount" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              name="Regiões Ativas"
              yAxisId="right"
              dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequência por Região */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Frequência por Região</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionFrequency.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="region" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value, 
                  name === 'frequency' ? 'Frequência' : 'Intensidade Média'
                ]}
              />
              <Bar dataKey="frequency" fill="#0ea5e9" name="Frequência" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taxa de Melhora */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Taxa de Melhora por Região</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={improvementRate.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ region, rate }) => `${region.substring(0, 8)}: ${rate.toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="rate"
              >
                {improvementRate.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Melhora']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Duração do Tratamento */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Duração do Tratamento por Região</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={treatmentDuration.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="region" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                value, 
                name === 'days' ? 'Dias' : 'Sessões'
              ]}
            />
            <Bar dataKey="days" fill="#f59e0b" name="Dias de Tratamento" />
            <Bar dataKey="sessions" fill="#10b981" name="Sessões" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Insights e Recomendações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Pontos Positivos</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {averagePainReduction > 20 && (
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Redução significativa da dor ({averagePainReduction.toFixed(1)}%)
                </li>
              )}
              {improvementRate.filter(r => r.rate > 50).length > 0 && (
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  {improvementRate.filter(r => r.rate > 50).length} região(ões) com boa taxa de melhora
                </li>
              )}
              {totalSessions >= 5 && (
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Aderência consistente ao tratamento
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Áreas de Atenção</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {averagePainReduction < 10 && totalSessions > 3 && (
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⚠</span>
                  Pouca redução da dor - reavaliar protocolo
                </li>
              )}
              {mostProblematicRegion?.frequency > 5 && (
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⚠</span>
                  {mostProblematicRegion.region} requer atenção especial
                </li>
              )}
              {treatmentDuration.filter(t => t.days > 60).length > 0 && (
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">!</span>
                  Algumas regiões em tratamento prolongado
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMapAnalytics;
