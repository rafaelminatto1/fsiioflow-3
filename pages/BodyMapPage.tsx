import React, { useMemo, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useData } from '../contexts/DataContext';
import BodyMapEditor from '../components/bodymap/BodyMapEditor';

const BodyMapPage: React.FC = () => {
  const { patients } = useData();
  const [patientId, setPatientId] = useState<string>('');

  const selectedPatient = useMemo(() => patients.find(p => p.id === patientId) ?? null, [patients, patientId]);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Mapa Corporal</h1>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
          <select value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full p-2 border border-slate-300 rounded">
            <option value="">Selecione um paciente</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedPatient ? (
          <BodyMapEditor patientId={selectedPatient.id} previousEvolutionHighlights={[]} />
        ) : (
          <div className="text-slate-500 text-sm">Selecione um paciente para iniciar a edição.</div>
        )}
      </div>
    </MainLayout>
  );
};

export default BodyMapPage;


