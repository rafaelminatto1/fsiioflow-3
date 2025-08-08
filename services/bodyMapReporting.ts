import type { BodyMapRegion } from '../lib/schema';

export function generateClinicalDescription(regions: BodyMapRegion[]): string {
  const lines = regions.map(r => `- ${r.regionName}: ${Array.isArray(r.symptomType) ? r.symptomType.join(', ') : r.symptomType} de intensidade ${r.painIntensity}/10, característica ${(r.painCharacteristic as string[]).join(', ')}, ${r.frequency}`);
  const now = new Date();
  const chronic = regions.filter(r => {
    const days = Math.ceil((now.getTime() - new Date(r.onsetDate).getTime()) / (1000 * 60 * 60 * 24));
    return days > 30;
  }).map(r => r.regionName);

  const improved = regions.filter(r => r.isImproved).map(r => r.regionName);
  const newOnes: string[] = []; // could be derived by comparing with previous

  return [
    'Paciente apresenta:',
    ...lines,
    '',
    `Regiões em tratamento há mais de 30 dias: ${chronic.join(', ') || 'Nenhuma'}`,
    `Melhora observada em: ${improved.join(', ') || 'Nenhuma'}`,
    `Novas queixas: ${newOnes.join(', ') || 'Nenhuma'}`,
  ].join('\n');
}


