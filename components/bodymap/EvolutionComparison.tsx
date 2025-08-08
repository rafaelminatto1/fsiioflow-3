import React from 'react';
import InteractiveBodyMap from '../InteractiveBodyMap';

interface BodyMapViewProps {
  title: string;
  date: string;
  parts: string[];
}

const BodyMapView: React.FC<BodyMapViewProps> = ({ title, date, parts }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      <span className="text-xs text-slate-500">{new Date(date).toLocaleDateString()}</span>
    </div>
    <InteractiveBodyMap selectedParts={parts} onSelectPart={() => {}} />
  </div>
);

interface EvolutionComparisonProps {
  firstSession: { date: string; selectedParts: string[] };
  currentSession: { date: string; selectedParts: string[] };
  improvedRegions: string[];
  worsenedRegions: string[];
  newRegions: string[];
}

const EvolutionComparison: React.FC<EvolutionComparisonProps> = ({ firstSession, currentSession, improvedRegions, worsenedRegions, newRegions }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <BodyMapView title="Primeira Sessão" date={firstSession.date} parts={firstSession.selectedParts} />
      <BodyMapView title="Sessão Atual" date={currentSession.date} parts={currentSession.selectedParts} />
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Diferenças</h4>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-semibold text-emerald-700">Melhorias</div>
            <ul className="list-disc list-inside text-slate-700">
              {improvedRegions.length ? improvedRegions.map(r => <li key={r}>{r}</li>) : <li className="text-slate-500">Nenhuma</li>}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-rose-700">Piora</div>
            <ul className="list-disc list-inside text-slate-700">
              {worsenedRegions.length ? worsenedRegions.map(r => <li key={r}>{r}</li>) : <li className="text-slate-500">Nenhuma</li>}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sky-700">Novas queixas</div>
            <ul className="list-disc list-inside text-slate-700">
              {newRegions.length ? newRegions.map(r => <li key={r}>{r}</li>) : <li className="text-slate-500">Nenhuma</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionComparison;


