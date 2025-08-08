import React, { useCallback, useEffect, useMemo, useState } from 'react';
import InteractiveBodyMap from '../InteractiveBodyMap';
import RegionDetailsPanel, { RegionFormData } from './RegionDetailsPanel';
import EvolutionTimeline from './EvolutionTimeline';
import { fetchPreset, createEvolution } from '../../services/bodyMapClient';

interface BodyMapEditorProps {
  patientId: string;
  evolutionId?: string;
  previousEvolutionHighlights?: string[];
  onSaved?: (id: string) => void;
}

const BodyMapEditor: React.FC<BodyMapEditorProps> = ({ patientId, previousEvolutionHighlights = [], onSaved }) => {
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [regionsByCode, setRegionsByCode] = useState<Record<string, RegionFormData>>({});
  const [currentRegionCode, setCurrentRegionCode] = useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Auto-preset regions from last evolution
    (async () => {
      const preset = await fetchPreset(patientId);
      if (preset && preset.length > 0) {
        const map: Record<string, RegionFormData> = {};
        const parts: string[] = [];
        preset.forEach(p => {
          map[p.regionCode] = {
            regionCode: p.regionCode,
            regionName: p.regionName,
            anatomicalGroup: p.anatomicalGroup,
            side: (p.side as any) ?? undefined,
            symptomType: p.symptomType as any,
            painIntensity: p.painIntensity,
            painCharacteristic: p.painCharacteristic as any,
            frequency: p.frequency as any,
            onsetDate: new Date(p.onsetDate).toISOString(),
            firstReportDate: new Date(p.firstReportDate).toISOString(),
            mechanism: p.mechanism ?? undefined,
            aggravatingFactors: p.aggravatingFactors ?? [],
            relievingFactors: p.relievingFactors ?? [],
            irradiationTo: p.irradiationTo ?? [],
            isActive: !!p.isActive,
            isImproved: !!p.isImproved,
            improvementPercentage: p.improvementPercentage ?? undefined,
            romLimitation: p.romLimitation ?? undefined,
            muscleStrength: p.muscleStrength ?? undefined,
            specialTests: p.specialTests ?? undefined,
          };
          parts.push(p.regionCode);
        });
        setRegionsByCode(map);
        setSelectedParts(parts);
        setCurrentRegionCode(parts[0]);
      }
    })();
  }, [patientId]);

  const onSelectPart = useCallback((partId: string) => {
    setSelectedParts(prev => {
      if (prev.includes(partId)) {
        return prev.filter(p => p !== partId);
      }
      return [...prev, partId];
    });
    setCurrentRegionCode(partId);
    setRegionsByCode(prev => {
      if (prev[partId]) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        [partId]: {
          regionCode: partId,
          regionName: partId,
          anatomicalGroup: 'desconhecido',
          side: undefined,
          symptomType: [],
          painIntensity: 0,
          painCharacteristic: [],
          frequency: 'Intermitente' as any,
          onsetDate: now,
          firstReportDate: now,
          aggravatingFactors: [],
          relievingFactors: [],
          irradiationTo: [],
          isActive: true,
          isImproved: false,
        },
      };
    });
  }, []);

  const currentRegion = useMemo(() => (currentRegionCode ? regionsByCode[currentRegionCode] ?? null : null), [currentRegionCode, regionsByCode]);

  const updateRegion = (data: RegionFormData) => {
    setRegionsByCode(prev => ({ ...prev, [data.regionCode]: data }));
  };

  const onSave = async () => {
    if (selectedParts.length === 0) return;
    setIsSaving(true);
    const payload = {
      patientId,
      generalNotes,
      regions: selectedParts.map(code => regionsByCode[code]).map(r => ({
        ...r,
        side: r.side ? (r.side.toLowerCase() as any) : undefined,
        frequency: (r.frequency as string).toLowerCase().replace(' ', '_'),
      })),
    };
    const res = await createEvolution(payload);
    setIsSaving(false);
    if (res?.evolution?.id && onSaved) onSaved(res.evolution.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <InteractiveBodyMap selectedParts={selectedParts} onSelectPart={onSelectPart} highlights={previousEvolutionHighlights} />
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <RegionDetailsPanel region={currentRegion} onChange={updateRegion} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="text-xs font-medium text-slate-600">Observações gerais da sessão</label>
        <textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={3} className="mt-1 w-full p-2 border border-slate-300 rounded text-sm" />
        <div className="mt-4 flex justify-end">
          <button disabled={isSaving} onClick={onSave} className="px-4 py-2 rounded bg-sky-600 text-white text-sm disabled:opacity-60">
            {isSaving ? 'Salvando...' : 'Salvar evolução'}
          </button>
        </div>
      </div>

      <div>
        <EvolutionTimeline points={selectedParts.map(code => ({ date: new Date().toISOString(), label: regionsByCode[code]?.regionName ?? code, intensity: regionsByCode[code]?.painIntensity }))} />
      </div>
    </div>
  );
};

export default BodyMapEditor;


