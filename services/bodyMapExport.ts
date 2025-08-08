import html2pdf from 'html2pdf.js';
import type { BodyMapEvolution, BodyMapRegion, RegionHistory } from '../lib/schema';
import { generateClinicalDescription } from './bodyMapReporting';

export interface ExportData {
  patient: {
    id: string;
    name: string;
    cpf: string;
    birthDate: string;
  };
  evolutions: Array<BodyMapEvolution & { regions: BodyMapRegion[] }>;
  regionHistories: RegionHistory[];
  dateRange: { start: string; end: string };
}

export class BodyMapExportService {
  static async exportToPDF(data: ExportData): Promise<void> {
    const htmlContent = this.generateHTMLReport(data);
    
    const options = {
      margin: 1,
      filename: `mapa-corporal-${data.patient.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(options).from(htmlContent).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha na geração do PDF');
    }
  }

  static exportToExcel(data: ExportData): void {
    // Simular exportação Excel com CSV
    const csvData = this.generateCSVData(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mapa-corporal-${data.patient.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private static generateHTMLReport(data: ExportData): string {
    const { patient, evolutions, regionHistories } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório do Mapa Corporal - ${patient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .patient-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .evolution { border: 1px solid #e2e8f0; margin: 20px 0; padding: 15px; border-radius: 8px; }
          .region { background: #fef2f2; margin: 10px 0; padding: 10px; border-left: 4px solid #ef4444; }
          .region.improved { background: #f0fdf4; border-left-color: #22c55e; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
          .timeline { margin: 20px 0; }
          .timeline-item { display: flex; align-items: center; margin: 10px 0; }
          .timeline-dot { width: 12px; height: 12px; background: #0ea5e9; border-radius: 50%; margin-right: 15px; }
          h1 { color: #0f172a; margin-bottom: 10px; }
          h2 { color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          h3 { color: #475569; }
          .pain-scale { display: inline-block; background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
          .pain-scale.low { background: #16a34a; }
          .pain-scale.medium { background: #ea580c; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório do Mapa Corporal</h1>
          <p><strong>Paciente:</strong> ${patient.name}</p>
          <p><strong>CPF:</strong> ${patient.cpf}</p>
          <p><strong>Data de Nascimento:</strong> ${new Date(patient.birthDate).toLocaleDateString()}</p>
          <p><strong>Período:</strong> ${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}</p>
          <p><strong>Relatório gerado em:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="patient-info">
          <h2>Resumo Clínico</h2>
          ${evolutions.length > 0 ? generateClinicalDescription(evolutions[0].regions) : 'Nenhuma evolução registrada.'}
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total de Evoluções</h3>
            <div style="font-size: 2em; font-weight: bold; color: #0ea5e9;">${evolutions.length}</div>
          </div>
          <div class="stat-card">
            <h3>Regiões Tratadas</h3>
            <div style="font-size: 2em; font-weight: bold; color: #0ea5e9;">${regionHistories.length}</div>
          </div>
          <div class="stat-card">
            <h3>Regiões Ativas</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc2626;">
              ${evolutions.length > 0 ? evolutions[0].regions.filter(r => r.isActive).length : 0}
            </div>
          </div>
        </div>

        <h2>Histórico de Evoluções</h2>
        ${evolutions.map(evolution => `
          <div class="evolution">
            <h3>Evolução - ${new Date(evolution.createdAt).toLocaleString()}</h3>
            ${evolution.generalNotes ? `<p><strong>Observações:</strong> ${evolution.generalNotes}</p>` : ''}
            
            <h4>Regiões Afetadas:</h4>
            ${evolution.regions.map(region => `
              <div class="region ${region.isImproved ? 'improved' : ''}">
                <div style="display: flex; justify-content: between; align-items: center;">
                  <strong>${region.regionName}</strong>
                  <span class="pain-scale ${region.painIntensity <= 3 ? 'low' : region.painIntensity <= 6 ? 'medium' : ''}">
                    EVA ${region.painIntensity}
                  </span>
                </div>
                <p><strong>Sintomas:</strong> ${Array.isArray(region.symptomType) ? region.symptomType.join(', ') : region.symptomType}</p>
                <p><strong>Características:</strong> ${Array.isArray(region.painCharacteristic) ? region.painCharacteristic.join(', ') : region.painCharacteristic}</p>
                <p><strong>Frequência:</strong> ${region.frequency}</p>
                ${region.mechanism ? `<p><strong>Mecanismo:</strong> ${region.mechanism}</p>` : ''}
                ${region.isImproved ? `<p style="color: #16a34a;"><strong>✓ Em melhora</strong> ${region.improvementPercentage ? `(${region.improvementPercentage}%)` : ''}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}

        <h2>Histórico por Região</h2>
        ${regionHistories.map(history => `
          <div style="margin: 15px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h4>${history.regionCode}</h4>
            <p><strong>Sessões:</strong> ${history.sessionsCount}</p>
            <p><strong>Duração do tratamento:</strong> ${history.totalTreatmentDays} dias</p>
            <p><strong>Intensidade média:</strong> ${Number(history.averageIntensity).toFixed(1)}/10</p>
            <p><strong>Primeira ocorrência:</strong> ${new Date(history.firstOccurrence).toLocaleDateString()}</p>
            <p><strong>Última ocorrência:</strong> ${new Date(history.lastOccurrence).toLocaleDateString()}</p>
            ${history.recurrences > 0 ? `<p style="color: #dc2626;"><strong>Recidivas:</strong> ${history.recurrences}</p>` : ''}
          </div>
        `).join('')}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.9em; color: #64748b;">
          <p>Este relatório foi gerado automaticamente pelo sistema FisioFlow.</p>
          <p>Para mais informações, consulte seu fisioterapeuta.</p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateCSVData(data: ExportData): string {
    const { patient, evolutions, regionHistories } = data;
    
    let csv = 'Paciente,CPF,Data Evolução,Região,Sintomas,Intensidade EVA,Características,Frequência,Lado,Ativo,Em Melhora\n';
    
    evolutions.forEach(evolution => {
      evolution.regions.forEach(region => {
        const row = [
          `"${patient.name}"`,
          patient.cpf,
          new Date(evolution.createdAt).toLocaleDateString(),
          `"${region.regionName}"`,
          `"${Array.isArray(region.symptomType) ? region.symptomType.join(', ') : region.symptomType}"`,
          region.painIntensity,
          `"${Array.isArray(region.painCharacteristic) ? region.painCharacteristic.join(', ') : region.painCharacteristic}"`,
          region.frequency,
          region.side || '',
          region.isActive ? 'Sim' : 'Não',
          region.isImproved ? 'Sim' : 'Não'
        ].join(',');
        csv += row + '\n';
      });
    });

    // Adicionar histórico por região
    csv += '\n\nHistórico por Região\n';
    csv += 'Região,Sessões,Dias Tratamento,Intensidade Média,Primeira Ocorrência,Última Ocorrência,Recidivas\n';
    
    regionHistories.forEach(history => {
      const row = [
        `"${history.regionCode}"`,
        history.sessionsCount,
        history.totalTreatmentDays,
        Number(history.averageIntensity).toFixed(1),
        new Date(history.firstOccurrence).toLocaleDateString(),
        new Date(history.lastOccurrence).toLocaleDateString(),
        history.recurrences
      ].join(',');
      csv += row + '\n';
    });

    return csv;
  }

  static generateQuickSummary(regions: BodyMapRegion[]): string {
    const activeRegions = regions.filter(r => r.isActive);
    const improvedRegions = regions.filter(r => r.isImproved);
    const highIntensityRegions = regions.filter(r => r.painIntensity >= 7);
    
    return `
Resumo Rápido:
• ${activeRegions.length} região(ões) ativa(s)
• ${improvedRegions.length} região(ões) em melhora
• ${highIntensityRegions.length} região(ões) com dor intensa (≥7)

Regiões ativas: ${activeRegions.map(r => r.regionName).join(', ') || 'Nenhuma'}
Regiões em melhora: ${improvedRegions.map(r => r.regionName).join(', ') || 'Nenhuma'}
    `.trim();
  }
}

export default BodyMapExportService;
