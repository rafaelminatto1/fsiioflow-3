import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Injury {
  id: string;
  patientId: string;
  name: string;
  description: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  startDate: Date;
  expectedRecoveryDate?: Date;
  actualRecoveryDate?: Date;
  status: 'active' | 'recovering' | 'recovered' | 'chronic';
  photos: InjuryPhoto[];
  sessions: InjurySession[];
  metrics: InjuryMetrics[];
  milestones: InjuryMilestone[];
}

interface InjuryPhoto {
  id: string;
  injuryId: string;
  url: string;
  thumbnail: string;
  caption?: string;
  takenAt: Date;
  type: 'before' | 'during' | 'after';
  annotations?: PhotoAnnotation[];
}

interface InjurySession {
  id: string;
  injuryId: string;
  sessionDate: Date;
  painLevel: number; // 0-10
  rangeOfMotion?: number; // graus
  muscleStrength?: number; // 1-5
  functionalScore?: number; // 0-100
  notes: string;
  exercises: string[];
  physiotherapistId: string;
}

interface InjuryMilestone {
  id: string;
  injuryId: string;
  title: string;
  description: string;
  date: Date;
  type: 'diagnosis' | 'surgery' | 'treatment_start' | 'improvement' | 'setback' | 'recovery';
  importance: 'low' | 'medium' | 'high';
}

interface InjuryMetrics {
  id: string;
  injuryId: string;
  date: Date;
  painLevel: number;
  rangeOfMotion?: number;
  muscleStrength?: number;
  functionalScore?: number;
  swelling?: number; // 0-10
  stiffness?: number; // 0-10
}

interface PhotoAnnotation {
  x: number;
  y: number;
  note: string;
}

interface InjuryTrackerProps {
  patientId: string;
  injuryId?: string;
}

export const InjuryTracker: React.FC<InjuryTrackerProps> = ({
  patientId,
  injuryId
}) => {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'photos' | 'metrics' | 'report'>('timeline');
  const [showNewInjuryModal, setShowNewInjuryModal] = useState(false);

  useEffect(() => {
    loadInjuries();
  }, [patientId]);

  useEffect(() => {
    if (injuryId && injuries.length > 0) {
      const injury = injuries.find(i => i.id === injuryId);
      setSelectedInjury(injury || null);
    }
  }, [injuryId, injuries]);

  const loadInjuries = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados
      const mockInjuries: Injury[] = [
        {
          id: '1',
          patientId,
          name: 'Lesão no Joelho Direito',
          description: 'Lesão ligamentar após atividade esportiva',
          bodyPart: 'Joelho Direito',
          severity: 'moderate',
          startDate: new Date('2024-01-15'),
          expectedRecoveryDate: new Date('2024-03-15'),
          status: 'recovering',
          photos: [],
          sessions: [
            {
              id: 's1',
              injuryId: '1',
              sessionDate: new Date('2024-01-20'),
              painLevel: 7,
              rangeOfMotion: 90,
              muscleStrength: 3,
              functionalScore: 60,
              notes: 'Primeira sessão. Paciente relatou dor intensa ao movimento.',
              exercises: ['Alongamento quadríceps', 'Fortalecimento isométrico'],
              physiotherapistId: 'physio1'
            },
            {
              id: 's2',
              injuryId: '1',
              sessionDate: new Date('2024-01-25'),
              painLevel: 6,
              rangeOfMotion: 95,
              muscleStrength: 3,
              functionalScore: 65,
              notes: 'Melhora gradual. Redução da dor.',
              exercises: ['Alongamento', 'Exercícios proprioceptivos'],
              physiotherapistId: 'physio1'
            }
          ],
          metrics: [],
          milestones: [
            {
              id: 'm1',
              injuryId: '1',
              title: 'Início do Tratamento',
              description: 'Primeira consulta e avaliação',
              date: new Date('2024-01-15'),
              type: 'treatment_start',
              importance: 'high'
            }
          ]
        }
      ];
      
      setInjuries(mockInjuries);
      if (mockInjuries.length > 0) {
        setSelectedInjury(mockInjuries[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar lesões:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSession = (sessionData: Omit<InjurySession, 'id'>) => {
    const newSession: InjurySession = {
      ...sessionData,
      id: crypto.randomUUID()
    };

    if (selectedInjury) {
      const updatedInjury = {
        ...selectedInjury,
        sessions: [...selectedInjury.sessions, newSession]
      };
      
      setSelectedInjury(updatedInjury);
      setInjuries(prev => prev.map(injury => 
        injury.id === selectedInjury.id ? updatedInjury : injury
      ));
    }
  };

  const addMilestone = (milestoneData: Omit<InjuryMilestone, 'id'>) => {
    const newMilestone: InjuryMilestone = {
      ...milestoneData,
      id: crypto.randomUUID()
    };

    if (selectedInjury) {
      const updatedInjury = {
        ...selectedInjury,
        milestones: [...selectedInjury.milestones, newMilestone]
      };
      
      setSelectedInjury(updatedInjury);
      setInjuries(prev => prev.map(injury => 
        injury.id === selectedInjury.id ? updatedInjury : injury
      ));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando rastreamento de lesões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="injury-tracker">
      {/* Header com seleção de lesão */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Rastreamento de Lesões</h1>
          <button
            onClick={() => setShowNewInjuryModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Nova Lesão
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={selectedInjury?.id || ''}
              onChange={(e) => {
                const injury = injuries.find(i => i.id === e.target.value);
                setSelectedInjury(injury || null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Selecione uma lesão</option>
              {injuries.map(injury => (
                <option key={injury.id} value={injury.id}>
                  {injury.name} - {injury.bodyPart} ({injury.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedInjury && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedInjury.name}</h2>
                <p className="text-gray-600">{selectedInjury.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedInjury.status === 'active' ? 'bg-red-100 text-red-800' :
                    selectedInjury.status === 'recovering' ? 'bg-yellow-100 text-yellow-800' :
                    selectedInjury.status === 'recovered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedInjury.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedInjury.severity === 'mild' ? 'bg-green-100 text-green-800' :
                    selectedInjury.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedInjury.severity}
                  </span>
                </div>
              </div>
              
              <div className="text-right text-sm text-gray-600">
                <div>Início: {format(selectedInjury.startDate, 'dd/MM/yyyy')}</div>
                {selectedInjury.expectedRecoveryDate && (
                  <div>Previsão: {format(selectedInjury.expectedRecoveryDate, 'dd/MM/yyyy')}</div>
                )}
                <div>{selectedInjury.sessions.length} sessões realizadas</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedInjury && (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'timeline', label: 'Timeline', count: selectedInjury.sessions.length + selectedInjury.milestones.length },
                  { id: 'photos', label: 'Fotos', count: selectedInjury.photos.length },
                  { id: 'metrics', label: 'Métricas', count: selectedInjury.sessions.length },
                  { id: 'report', label: 'Relatório', count: null }
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
                    {tab.count !== null && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'timeline' && (
                <TimelineTab
                  injury={selectedInjury}
                  onAddSession={addSession}
                  onAddMilestone={addMilestone}
                />
              )}
              {activeTab === 'photos' && (
                <PhotosTab
                  photos={selectedInjury.photos}
                  injuryId={selectedInjury.id}
                />
              )}
              {activeTab === 'metrics' && (
                <MetricsTab
                  sessions={selectedInjury.sessions}
                  metrics={selectedInjury.metrics}
                />
              )}
              {activeTab === 'report' && (
                <ReportTab injury={selectedInjury} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Componente Timeline
const TimelineTab: React.FC<{
  injury: Injury;
  onAddSession: (session: Omit<InjurySession, 'id'>) => void;
  onAddMilestone: (milestone: Omit<InjuryMilestone, 'id'>) => void;
}> = ({ injury, onAddSession, onAddMilestone }) => {
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // Combinar sessões e marcos
  const timelineItems = [
    ...injury.sessions.map(session => ({
      id: session.id,
      date: session.sessionDate,
      type: 'session' as const,
      data: session
    })),
    ...injury.milestones.map(milestone => ({
      id: milestone.id,
      date: milestone.date,
      type: 'milestone' as const,
      data: milestone
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowAddSession(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Adicionar Sessão
        </button>
        <button
          onClick={() => setShowAddMilestone(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Adicionar Marco
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-8">
          {timelineItems.map((item, index) => (
            <div key={item.id} className="relative flex items-start space-x-4">
              {/* Marcador */}
              <div className={`relative z-10 w-4 h-4 rounded-full ${
                item.type === 'session' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.type === 'session' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'session' ? 'Sessão' : 'Marco'}
                    </span>
                  </div>

                  {item.type === 'session' ? (
                    <SessionCard session={item.data as InjurySession} />
                  ) : (
                    <MilestoneCard milestone={item.data as InjuryMilestone} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{injury.sessions.length}</div>
          <div className="text-sm text-blue-800">Total de Sessões</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {injury.sessions.length > 0 
              ? (injury.sessions.reduce((sum, s) => sum + s.painLevel, 0) / injury.sessions.length).toFixed(1)
              : '0'}
          </div>
          <div className="text-sm text-green-800">Dor Média</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {Math.ceil((new Date().getTime() - new Date(injury.startDate).getTime()) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-sm text-yellow-800">Dias de Tratamento</div>
        </div>
      </div>
    </div>
  );
};

const SessionCard: React.FC<{ session: InjurySession }> = ({ session }) => (
  <div>
    <h4 className="font-semibold text-gray-900 mb-2">Sessão de Fisioterapia</h4>
    
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Dor:</span>
        <div className="flex items-center space-x-1">
          <span className="font-semibold">{session.painLevel}/10</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${(session.painLevel / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {session.rangeOfMotion && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Amplitude:</span>
          <span className="font-semibold">{session.rangeOfMotion}°</span>
        </div>
      )}
      
      {session.muscleStrength && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Força:</span>
          <span className="font-semibold">{session.muscleStrength}/5</span>
        </div>
      )}
      
      {session.functionalScore && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Funcional:</span>
          <span className="font-semibold">{session.functionalScore}/100</span>
        </div>
      )}
    </div>

    {session.notes && (
      <div className="mb-3">
        <span className="text-sm text-gray-600">Observações:</span>
        <p className="text-sm text-gray-800 mt-1">{session.notes}</p>
      </div>
    )}

    {session.exercises.length > 0 && (
      <div>
        <span className="text-sm text-gray-600">Exercícios:</span>
        <ul className="text-sm text-gray-800 mt-1">
          {session.exercises.map((exercise, index) => (
            <li key={index}>• {exercise}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const MilestoneCard: React.FC<{ milestone: InjuryMilestone }> = ({ milestone }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
      <span className={`px-2 py-1 text-xs rounded-full ${
        milestone.importance === 'high' ? 'bg-red-100 text-red-800' :
        milestone.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {milestone.type}
      </span>
    </div>
    
    {milestone.description && (
      <p className="text-sm text-gray-600">{milestone.description}</p>
    )}
  </div>
);

// Componentes das outras abas (simplificados)
const PhotosTab: React.FC<{ photos: InjuryPhoto[]; injuryId: string }> = ({ photos, injuryId }) => (
  <div className="text-center py-12 text-gray-500">
    <p>Funcionalidade de fotos será implementada em breve</p>
    <p className="text-sm">Total de fotos: {photos.length}</p>
  </div>
);

const MetricsTab: React.FC<{ sessions: InjurySession[]; metrics: InjuryMetrics[] }> = ({ sessions, metrics }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Evolução das Métricas</h3>
    
    {sessions.length > 0 ? (
      <div className="space-y-4">
        {/* Gráfico de dor */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Evolução da Dor</h4>
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <div key={session.id} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-20">
                  {format(session.sessionDate, 'dd/MM')}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-red-500 h-4 rounded-full"
                    style={{ width: `${(session.painLevel / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-8">{session.painLevel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 text-gray-500">
        <p>Nenhuma sessão registrada ainda</p>
      </div>
    )}
  </div>
);

const ReportTab: React.FC<{ injury: Injury }> = ({ injury }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Relatório da Lesão</h3>
    
    <div className="bg-gray-50 rounded-lg p-6">
      <h4 className="font-semibold mb-4">Resumo do Tratamento</h4>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-sm text-gray-600">Lesão:</span>
          <p className="font-semibold">{injury.name}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Status:</span>
          <p className="font-semibold capitalize">{injury.status}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Gravidade:</span>
          <p className="font-semibold capitalize">{injury.severity}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Duração do Tratamento:</span>
          <p className="font-semibold">
            {Math.ceil((new Date().getTime() - new Date(injury.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
          </p>
        </div>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Exportar Relatório PDF
      </button>
    </div>
  </div>
);