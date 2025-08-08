import React, { useMemo } from 'react';
import PainScale from '../PainScale';

export type SymptomType =
  | 'Dor aguda'
  | 'Dor crônica'
  | 'Limitação de movimento'
  | 'Edema'
  | 'Parestesia'
  | 'Fraqueza muscular'
  | 'Instabilidade'
  | 'Contratura'
  | 'Trigger points';

export type Frequency = 'Constante' | 'Intermitente' | 'Ao movimento' | 'Em repouso' | 'Noturna';
export type Side = 'Direito' | 'Esquerdo' | 'Bilateral';

export interface RegionFormData {
  regionCode: string;
  regionName: string;
  anatomicalGroup: string;
  side?: Side;
  symptomType: SymptomType[];
  painIntensity: number;
  painCharacteristic: string[];
  frequency: Frequency;
  onsetDate: string; // ISO
  firstReportDate: string; // ISO
  mechanism?: string;
  aggravatingFactors: string[];
  relievingFactors: string[];
  irradiationTo: string[];
  isActive: boolean;
  isImproved: boolean;
  improvementPercentage?: number;
  romLimitation?: Record<string, unknown> | null;
  muscleStrength?: number | null;
  specialTests?: Record<string, unknown> | null;
}

interface RegionDetailsPanelProps {
  region: RegionFormData | null;
  onChange: (data: RegionFormData) => void;
}

const SYMPTOMS: SymptomType[] = [
  'Dor aguda',
  'Dor crônica',
  'Limitação de movimento',
  'Edema',
  'Parestesia',
  'Fraqueza muscular',
  'Instabilidade',
  'Contratura',
  'Trigger points',
];

const FREQUENCIES: Frequency[] = ['Constante', 'Intermitente', 'Ao movimento', 'Em repouso', 'Noturna'];
const SIDES: Side[] = ['Direito', 'Esquerdo', 'Bilateral'];

const PAIN_CHARACTERISTICS = ['Queimação', 'Pontada', 'Latejante', 'Em aperto', 'Em peso', 'Formigamento'];

const RegionDetailsPanel: React.FC<RegionDetailsPanelProps> = ({ region, onChange }) => {
  const disabled = !region;

  const update = (partial: Partial<RegionFormData>) => {
    if (!region) return;
    onChange({ ...region, ...partial });
  };

  const selectedChars = useMemo(() => new Set(region?.painCharacteristic ?? []), [region?.painCharacteristic]);
  const selectedSymptoms = useMemo(() => new Set(region?.symptomType ?? []), [region?.symptomType]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Detalhes da Região</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Lado afetado</label>
          <div className="mt-1 flex gap-2">
            {SIDES.map(s => (
              <button
                key={s}
                disabled={disabled}
                onClick={() => update({ side: s })}
                className={`px-2 py-1 text-xs rounded border ${region?.side === s ? 'bg-sky-100 border-sky-300' : 'border-slate-300 hover:bg-slate-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Frequência</label>
          <select
            disabled={disabled}
            value={region?.frequency ?? ''}
            onChange={e => update({ frequency: e.target.value as Frequency })}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
          >
            <option value="">Selecione</option>
            {FREQUENCIES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <PainScale selectedScore={region?.painIntensity} onSelectScore={v => update({ painIntensity: v })} />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Características da dor</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {PAIN_CHARACTERISTICS.map(c => (
              <button
                type="button"
                key={c}
                disabled={disabled}
                onClick={() => {
                  if (!region) return;
                  const set = new Set(region.painCharacteristic);
                  if (set.has(c)) set.delete(c); else set.add(c);
                  update({ painCharacteristic: Array.from(set) });
                }}
                className={`px-2 py-1 text-xs rounded border ${selectedChars.has(c) ? 'bg-rose-50 border-rose-300' : 'border-slate-300 hover:bg-slate-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Sintomas</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {SYMPTOMS.map(s => (
              <button
                type="button"
                key={s}
                disabled={disabled}
                onClick={() => {
                  if (!region) return;
                  const set = new Set(region.symptomType);
                  if (set.has(s)) set.delete(s); else set.add(s);
                  update({ symptomType: Array.from(set) });
                }}
                className={`px-2 py-1 text-xs rounded border ${selectedSymptoms.has(s) ? 'bg-teal-50 border-teal-300' : 'border-slate-300 hover:bg-slate-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Início dos sintomas</label>
          <input
            type="date"
            disabled={disabled}
            value={region?.onsetDate?.slice(0, 10) ?? ''}
            onChange={e => update({ onsetDate: new Date(e.target.value).toISOString() })}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Primeiro relato</label>
          <input
            type="date"
            disabled={disabled}
            value={region?.firstReportDate?.slice(0, 10) ?? ''}
            onChange={e => update({ firstReportDate: new Date(e.target.value).toISOString() })}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Mecanismo de lesão</label>
          <textarea
            disabled={disabled}
            value={region?.mechanism ?? ''}
            onChange={e => update({ mechanism: e.target.value })}
            rows={2}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
            placeholder="Ex.: Torção durante corrida..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Fatores agravantes</label>
          <input
            disabled={disabled}
            value={(region?.aggravatingFactors ?? []).join(', ')}
            onChange={e => update({ aggravatingFactors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
            placeholder="Ex.: Agachamento, subir escadas"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Fatores atenuantes</label>
          <input
            disabled={disabled}
            value={(region?.relievingFactors ?? []).join(', ')}
            onChange={e => update({ relievingFactors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
            placeholder="Ex.: Gelo, repouso"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Irradiação</label>
          <input
            disabled={disabled}
            value={(region?.irradiationTo ?? []).join(', ')}
            onChange={e => update({ irradiationTo: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="mt-1 w-full p-2 border border-slate-300 rounded text-sm"
            placeholder="Ex.: coxa_anterior, joelho_medial"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" disabled={disabled} checked={!!region?.isActive} onChange={e => update({ isActive: e.target.checked })} />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" disabled={disabled} checked={!!region?.isImproved} onChange={e => update({ isImproved: e.target.checked })} />
            Em melhora
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">% melhora</span>
            <input
              type="number"
              disabled={disabled}
              value={region?.improvementPercentage ?? ''}
              onChange={e => update({ improvementPercentage: e.target.value ? Number(e.target.value) : undefined })}
              className="w-20 p-1 border border-slate-300 rounded text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionDetailsPanel;


