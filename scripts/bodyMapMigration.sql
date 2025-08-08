-- Migração para Body Map - Criação das tabelas
-- Execute este script no seu banco PostgreSQL

BEGIN;

-- Criar tabela de evoluções do mapa corporal
CREATE TABLE IF NOT EXISTS body_map_evolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    appointment_id UUID,
    soap_note_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    general_notes TEXT,
    
    CONSTRAINT fk_body_map_evolutions_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_body_map_evolutions_appointment 
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_body_map_evolutions_soap_note 
        FOREIGN KEY (soap_note_id) REFERENCES soap_notes(id) ON DELETE SET NULL
);

-- Criar índices para body_map_evolutions
CREATE INDEX IF NOT EXISTS idx_body_map_evolutions_patient ON body_map_evolutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_body_map_evolutions_patient_created ON body_map_evolutions(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_body_map_evolutions_appointment ON body_map_evolutions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_body_map_evolutions_soap_note ON body_map_evolutions(soap_note_id) WHERE soap_note_id IS NOT NULL;

-- Criar tabela de regiões do mapa corporal
CREATE TABLE IF NOT EXISTS body_map_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    body_map_evolution_id UUID NOT NULL,
    
    -- Identificação anatômica
    region_code VARCHAR(120) NOT NULL,
    region_name VARCHAR(200) NOT NULL,
    anatomical_group VARCHAR(120) NOT NULL,
    side VARCHAR(20), -- 'direito', 'esquerdo', 'bilateral'
    
    -- Sintomas
    symptom_type JSONB NOT NULL,
    pain_intensity INTEGER NOT NULL CHECK (pain_intensity >= 0 AND pain_intensity <= 10),
    pain_characteristic JSONB NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    
    -- Tracking
    onset_date TIMESTAMP WITH TIME ZONE NOT NULL,
    first_report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Dados clínicos
    mechanism TEXT,
    aggravating_factors JSONB,
    relieving_factors JSONB,
    irradiation_to JSONB, -- códigos de outras regiões
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_improved BOOLEAN NOT NULL DEFAULT false,
    improvement_percentage INTEGER CHECK (improvement_percentage >= 0 AND improvement_percentage <= 100),
    
    -- Medidas objetivas
    rom_limitation JSONB,
    muscle_strength INTEGER CHECK (muscle_strength >= 0 AND muscle_strength <= 5),
    special_tests JSONB,
    
    CONSTRAINT fk_body_map_regions_evolution 
        FOREIGN KEY (body_map_evolution_id) REFERENCES body_map_evolutions(id) ON DELETE CASCADE
);

-- Criar índices para body_map_regions
CREATE INDEX IF NOT EXISTS idx_body_map_regions_evolution ON body_map_regions(body_map_evolution_id);
CREATE INDEX IF NOT EXISTS idx_body_map_regions_code_evolution ON body_map_regions(region_code, body_map_evolution_id);
CREATE INDEX IF NOT EXISTS idx_body_map_regions_region_code ON body_map_regions(region_code);
CREATE INDEX IF NOT EXISTS idx_body_map_regions_pain_intensity ON body_map_regions(pain_intensity);
CREATE INDEX IF NOT EXISTS idx_body_map_regions_is_active ON body_map_regions(is_active);

-- Criar tabela de histórico agregado por região
CREATE TABLE IF NOT EXISTS region_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    region_code VARCHAR(120) NOT NULL,
    
    -- Estatísticas agregadas
    total_treatment_days INTEGER NOT NULL DEFAULT 0,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    average_intensity DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_intensity INTEGER NOT NULL DEFAULT 0,
    min_intensity INTEGER NOT NULL DEFAULT 0,
    
    -- Marcos temporais
    first_occurrence TIMESTAMP WITH TIME ZONE NOT NULL,
    last_occurrence TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution_date TIMESTAMP WITH TIME ZONE,
    recurrences INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT fk_region_histories_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT uq_region_histories_patient_region 
        UNIQUE (patient_id, region_code)
);

-- Criar índices para region_histories
CREATE INDEX IF NOT EXISTS idx_region_histories_patient ON region_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_region_histories_region_code ON region_histories(region_code);
CREATE INDEX IF NOT EXISTS idx_region_histories_sessions_count ON region_histories(sessions_count);
CREATE INDEX IF NOT EXISTS idx_region_histories_average_intensity ON region_histories(average_intensity);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para body_map_evolutions
DROP TRIGGER IF EXISTS update_body_map_evolutions_updated_at ON body_map_evolutions;
CREATE TRIGGER update_body_map_evolutions_updated_at
    BEFORE UPDATE ON body_map_evolutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular estatísticas de região
CREATE OR REPLACE FUNCTION calculate_region_statistics()
RETURNS TRIGGER AS $$
DECLARE
    patient_id_var UUID;
    region_code_var VARCHAR(120);
    stats_record RECORD;
BEGIN
    -- Obter patient_id através da evolução
    SELECT bme.patient_id INTO patient_id_var
    FROM body_map_evolutions bme
    WHERE bme.id = NEW.body_map_evolution_id;
    
    region_code_var := NEW.region_code;
    
    -- Calcular estatísticas agregadas
    SELECT 
        COUNT(*) as sessions,
        AVG(pain_intensity) as avg_intensity,
        MAX(pain_intensity) as max_intensity,
        MIN(pain_intensity) as min_intensity,
        MIN(first_report_date) as first_occurrence,
        MAX(COALESCE(
            (SELECT bme.created_at FROM body_map_evolutions bme WHERE bme.id = body_map_evolution_id),
            NOW()
        )) as last_occurrence
    INTO stats_record
    FROM body_map_regions bmr
    JOIN body_map_evolutions bme ON bmr.body_map_evolution_id = bme.id
    WHERE bme.patient_id = patient_id_var 
    AND bmr.region_code = region_code_var;
    
    -- Upsert na tabela de histórico
    INSERT INTO region_histories (
        patient_id,
        region_code,
        sessions_count,
        average_intensity,
        max_intensity,
        min_intensity,
        first_occurrence,
        last_occurrence,
        total_treatment_days
    ) VALUES (
        patient_id_var,
        region_code_var,
        stats_record.sessions,
        stats_record.avg_intensity,
        stats_record.max_intensity,
        stats_record.min_intensity,
        stats_record.first_occurrence,
        stats_record.last_occurrence,
        EXTRACT(DAY FROM (stats_record.last_occurrence - stats_record.first_occurrence))
    )
    ON CONFLICT (patient_id, region_code)
    DO UPDATE SET
        sessions_count = EXCLUDED.sessions_count,
        average_intensity = EXCLUDED.average_intensity,
        max_intensity = EXCLUDED.max_intensity,
        min_intensity = EXCLUDED.min_intensity,
        last_occurrence = EXCLUDED.last_occurrence,
        total_treatment_days = EXCLUDED.total_treatment_days;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas automaticamente
DROP TRIGGER IF EXISTS update_region_statistics ON body_map_regions;
CREATE TRIGGER update_region_statistics
    AFTER INSERT OR UPDATE ON body_map_regions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_region_statistics();

-- Inserir dados de exemplo (opcional - remover em produção)
-- Dados de teste apenas se não houver pacientes
DO $$
DECLARE
    test_patient_id UUID;
    test_evolution_id UUID;
BEGIN
    -- Verificar se já existem pacientes
    IF (SELECT COUNT(*) FROM patients) = 0 THEN
        -- Criar paciente de teste
        INSERT INTO patients (
            name, cpf, birth_date, phone, email, registration_date, status
        ) VALUES (
            'João Silva (Teste)', '12345678901', '1980-05-15', '(11) 99999-9999', 
            'joao.teste@email.com', '2024-01-01', 'Active'
        ) RETURNING id INTO test_patient_id;
        
        -- Criar evolução de teste
        INSERT INTO body_map_evolutions (
            patient_id, general_notes
        ) VALUES (
            test_patient_id, 'Primeira sessão - avaliação inicial'
        ) RETURNING id INTO test_evolution_id;
        
        -- Inserir regiões de teste
        INSERT INTO body_map_regions (
            body_map_evolution_id, region_code, region_name, anatomical_group,
            side, symptom_type, pain_intensity, pain_characteristic, frequency,
            onset_date, first_report_date, mechanism, is_active
        ) VALUES 
        (
            test_evolution_id, 'lombar_l4_l5', 'Lombar L4-L5', 'coluna_vertebral',
            'bilateral', '["dor_cronica", "limitacao_movimento"]', 7,
            '["latejante", "em_peso"]', 'constante',
            NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days',
            'Levantamento de peso inadequado', true
        ),
        (
            test_evolution_id, 'ombro_direito', 'Ombro Direito', 'membro_superior',
            'direito', '["dor_aguda", "limitacao_movimento"]', 5,
            '["pontada"]', 'ao_movimento',
            NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days',
            'Movimento repetitivo no trabalho', true
        );
        
        RAISE NOTICE 'Dados de teste inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Pacientes já existem - pulando inserção de dados de teste';
    END IF;
END $$;

-- Criar view para facilitar consultas
CREATE OR REPLACE VIEW v_body_map_summary AS
SELECT 
    p.id as patient_id,
    p.name as patient_name,
    bme.id as evolution_id,
    bme.created_at as evolution_date,
    bmr.region_name,
    bmr.pain_intensity,
    bmr.is_active,
    bmr.is_improved,
    bmr.improvement_percentage,
    EXTRACT(DAY FROM (NOW() - bmr.onset_date)) as days_since_onset
FROM patients p
JOIN body_map_evolutions bme ON p.id = bme.patient_id
JOIN body_map_regions bmr ON bme.id = bmr.body_map_evolution_id
ORDER BY bme.created_at DESC;

-- Comentários para documentação
COMMENT ON TABLE body_map_evolutions IS 'Evoluções do mapa corporal por sessão/consulta';
COMMENT ON TABLE body_map_regions IS 'Regiões anatômicas afetadas em cada evolução';
COMMENT ON TABLE region_histories IS 'Histórico agregado por região para analytics';

COMMENT ON COLUMN body_map_regions.pain_intensity IS 'Intensidade da dor na escala EVA (0-10)';
COMMENT ON COLUMN body_map_regions.symptom_type IS 'Array JSON com tipos de sintomas';
COMMENT ON COLUMN body_map_regions.pain_characteristic IS 'Array JSON com características da dor';
COMMENT ON COLUMN body_map_regions.improvement_percentage IS 'Percentual de melhora (0-100%)';

COMMIT;

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('body_map_evolutions', 'body_map_regions', 'region_histories')
ORDER BY tablename;
