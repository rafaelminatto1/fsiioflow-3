import React, { useState, useEffect } from 'react';
import { AIEconomicsService, EconomicMetrics, OptimizationOpportunity, DemandPrediction } from '../../services/ai-economics';

interface EconomicsDashboardProps {
  clinicId: string;
}

export const EconomicsDashboard: React.FC<EconomicsDashboardProps> = ({ clinicId }) => {
  const [metrics, setMetrics] = useState<EconomicMetrics | null>(null);
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState<'overview' | 'optimization' | 'predictions' | 'costs'>('overview');

  const economicsService = new AIEconomicsService();

  useEffect(() => {
    loadData();
  }, [clinicId, selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, predictionsData] = await Promise.all([
        economicsService.analyzeEconomicMetrics(clinicId, selectedPeriod),
        economicsService.predictDemand(clinicId, 14) // 14 dias à frente
      ]);
      
      setMetrics(metricsData);
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Erro ao carregar dados econômicos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análise econômica...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Não foi possível carregar os dados econômicos.</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="economics-dashboard">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Econômico</h1>
            <p className="text-gray-600">Análise inteligente de custos e receitas</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="12months">Últimos 12 meses</option>
            </select>
            
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Visão Geral' },
              { id: 'optimization', label: 'Otimizações' },
              { id: 'predictions', label: 'Predições' },
              { id: 'costs', label: 'Análise de Custos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab metrics={metrics} />}
          {activeTab === 'optimization' && <OptimizationTab opportunities={metrics.optimizationOpportunities} />}
          {activeTab === 'predictions' && <PredictionsTab predictions={predictions} />}
          {activeTab === 'costs' && <CostsTab metrics={metrics} />}
        </div>
      </div>
    </div>
  );
};

// Componente da aba Visão Geral
const OverviewTab: React.FC<{ metrics: EconomicMetrics }> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR')}`}
          change={12.5}
          icon="💰"
        />
        <MetricCard
          title="Margem de Lucro"
          value={`${(metrics.profitMargin * 100).toFixed(1)}%`}
          change={-2.3}
          icon="📈"
        />
        <MetricCard
          title="Utilização de Recursos"
          value={`${(metrics.resourceUtilization * 100).toFixed(1)}%`}
          change={8.7}
          icon="🏥"
        />
        <MetricCard
          title="Custo por Sessão"
          value={`R$ ${metrics.costPerSession.toFixed(2)}`}
          change={-5.2}
          icon="💳"
        />
      </div>

      {/* Gráfico de receita vs custos */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Receita vs Custos</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Receita Total</span>
            <div className="flex items-center space-x-2">
              <div className="w-64 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-green-600 font-semibold">R$ {metrics.totalRevenue.toLocaleString('pt-BR')}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Custos Totais</span>
            <div className="flex items-center space-x-2">
              <div className="w-64 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-red-500 h-4 rounded-full"
                  style={{ width: `${(metrics.totalCosts / metrics.totalRevenue) * 100}%` }}
                />
              </div>
              <span className="text-red-600 font-semibold">R$ {metrics.totalCosts.toLocaleString('pt-BR')}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-gray-900 font-semibold">Lucro Líquido</span>
            <span className="text-blue-600 font-bold text-lg">
              R$ {(metrics.totalRevenue - metrics.totalCosts).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente da aba Otimizações
const OptimizationTab: React.FC<{ opportunities: OptimizationOpportunity[] }> = ({ opportunities }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Oportunidades de Otimização</h3>
        <p className="text-gray-600 mb-6">
          {opportunities.length} oportunidades identificadas para reduzir custos e aumentar eficiência
        </p>
      </div>

      <div className="space-y-4">
        {opportunities.map((opportunity, index) => (
          <div key={opportunity.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  opportunity.priority >= 8 ? 'bg-red-500' :
                  opportunity.priority >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    opportunity.type === 'schedule' ? 'bg-blue-100 text-blue-800' :
                    opportunity.type === 'resource' ? 'bg-green-100 text-green-800' :
                    opportunity.type === 'pricing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {opportunity.type}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  R$ {opportunity.potentialSavings.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-500">economia potencial</div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{opportunity.description}</p>

            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Esforço:</span>
                <span className={`px-2 py-1 rounded-full ${
                  opportunity.effort === 'low' ? 'bg-green-100 text-green-800' :
                  opportunity.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {opportunity.effort}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Impacto:</span>
                <span className={`px-2 py-1 rounded-full ${
                  opportunity.impact === 'high' ? 'bg-green-100 text-green-800' :
                  opportunity.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {opportunity.impact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente da aba Predições
const PredictionsTab: React.FC<{ predictions: DemandPrediction[] }> = ({ predictions }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Predição de Demanda</h3>
        <p className="text-gray-600 mb-6">Previsão baseada em IA para os próximos 14 dias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de demanda */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Demanda Prevista</h4>
          <div className="space-y-2">
            {predictions.slice(0, 7).map((prediction, index) => (
              <div key={prediction.date} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-16">
                    {new Date(prediction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: `${(prediction.predictedDemand / 25) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{prediction.predictedDemand} sessões</span>
                  <div className="text-xs text-gray-500">
                    {(prediction.confidence * 100).toFixed(0)}% confiança
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas de predição */}
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Receita Projetada (7 dias)</h4>
            <div className="text-2xl font-bold text-blue-600">
              R$ {predictions.slice(0, 7).reduce((sum, p) => sum + p.revenueProjection, 0).toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Capacidade Sugerida</h4>
            <div className="text-2xl font-bold text-green-600">
              {Math.max(...predictions.slice(0, 7).map(p => p.suggestedCapacity))} sessões/dia
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Confiança Média</h4>
            <div className="text-2xl font-bold text-yellow-600">
              {(predictions.slice(0, 7).reduce((sum, p) => sum + p.confidence, 0) / 7 * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente da aba Análise de Custos
const CostsTab: React.FC<{ metrics: EconomicMetrics }> = ({ metrics }) => {
  // Dados simulados para demonstração
  const costBreakdown = {
    'Salários': metrics.totalCosts * 0.6,
    'Aluguel': metrics.totalCosts * 0.2,
    'Equipamentos': metrics.totalCosts * 0.1,
    'Materiais': metrics.totalCosts * 0.05,
    'Outros': metrics.totalCosts * 0.05
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Análise Detalhada de Custos</h3>
      </div>

      {/* Breakdown de custos */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold mb-4">Distribuição de Custos</h4>
        <div className="space-y-4">
          {Object.entries(costBreakdown).map(([category, amount]) => {
            const percentage = (amount / metrics.totalCosts) * 100;
            return (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 w-24">{category}</span>
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold">R$ {amount.toLocaleString('pt-BR')}</span>
                  <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="font-semibold text-yellow-900 mb-4">Recomendações de Redução de Custos</h4>
        <ul className="space-y-2 text-yellow-800">
          <li>• Revisar contratos de fornecedores para negociar melhores preços</li>
          <li>• Implementar sistema de controle de estoque para reduzir desperdícios</li>
          <li>• Otimizar escala de funcionários baseada na demanda prevista</li>
          <li>• Considerar equipamentos compartilhados para reduzir depreciação</li>
        </ul>
      </div>
    </div>
  );
};

// Componente auxiliar para cards de métricas
const MetricCard: React.FC<{
  title: string;
  value: string;
  change: number;
  icon: string;
}> = ({ title, value, change, icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-2xl">{icon}</span>
      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
        change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-gray-600 text-sm">{title}</p>
  </div>
);