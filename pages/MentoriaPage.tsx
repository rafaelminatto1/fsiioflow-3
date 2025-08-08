// pages/MentoriaPage.tsx

import React, { useEffect, useState } from 'react';
import { getMentoriaSessions, Session, checkApiHealth } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { Loader, Wifi, WifiOff, Server } from 'lucide-react';

export default function MentoriaPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'checking'>('checking');

  useEffect(() => {
    const fetchHealth = async () => {
        const health = await checkApiHealth();
        setApiStatus(health.status as 'ok' | 'error');
    };

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMentoriaSessions();
        setSessions(data);
      } catch (err: any) {
        // Graças ao interceptor, 'err' já é um objeto de erro padronizado
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealth();
    fetchSessions();
  }, []);

  const ApiStatusIndicator = () => (
    <div className="flex items-center">
        {apiStatus === 'checking' && <><Loader className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>}
        {apiStatus === 'ok' && <><Wifi className="w-4 h-4 mr-2 text-green-500" /> API Conectada</>}
        {apiStatus === 'error' && <><WifiOff className="w-4 h-4 mr-2 text-red-500" /> API Desconectada</>}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Módulo de Mentoria"
        subtitle="Conecte-se com especialistas para aprimorar sua prática clínica."
      >
        <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <ApiStatusIndicator />
        </div>
      </PageHeader>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Server className="w-5 h-5 mr-2 text-teal-500" />
          Sessões Disponíveis
        </h2>
        {isLoading && <p className="text-slate-500 flex items-center"><Loader className="w-4 h-4 mr-2 animate-spin"/>Carregando sessões... O backend pode demorar para iniciar.</p>}
        {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg"><strong>Erro:</strong> {error}</p>}
        {!isLoading && !error && (
          <ul className="divide-y divide-slate-200">
            {sessions.length > 0 ? sessions.map(session => (
              <li key={session.id} className="py-3">
                <p className="font-semibold text-slate-900">{session.topic}</p>
                <p className="text-sm text-slate-500">Mentor: {session.mentor}</p>
              </li>
            )) : <p className="text-slate-500">Nenhuma sessão de mentoria disponível no momento.</p>}
          </ul>
        )}
      </div>
       <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-lg text-sm">
          <p><strong>Nota do Desenvolvedor:</strong> Esta página se comunica com um backend Flask em <code>http://localhost:5000</code>. O backend simula falhas de rede com 30% de chance para testar a lógica de retry com exponential backoff. Se a API estiver offline, você verá uma mensagem de erro de conexão. Se a API retornar um erro 503, o frontend tentará reconectar 3 vezes antes de exibir o erro.</p>
        </div>
    </>
  );
}