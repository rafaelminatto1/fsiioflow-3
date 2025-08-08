import React from 'react';

export interface TimelinePoint {
  date: string; // ISO
  label: string;
  intensity?: number;
}

interface EvolutionTimelineProps {
  points: TimelinePoint[];
}

const EvolutionTimeline: React.FC<EvolutionTimelineProps> = ({ points }) => {
  if (!points || points.length === 0) {
    return <div className="text-sm text-slate-500">Sem histórico.</div>;
  }

  const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className="relative border-l-2 border-slate-200 ml-3">
        <ul className="space-y-6">
          {sorted.map((p, idx) => (
            <li key={idx} className="relative">
              <div className="absolute -left-[28px] top-1 w-5 h-5 rounded-full bg-sky-500 ring-4 ring-white" />
              <div className="ml-6">
                <div className="text-sm font-semibold text-slate-700">{new Date(p.date).toLocaleDateString()}</div>
                <div className="text-xs text-slate-600">{p.label}{p.intensity !== undefined ? ` • EVA ${p.intensity}` : ''}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EvolutionTimeline;


