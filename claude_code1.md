# Prompts Completos para Claude Code - FisioFlow

## 🤖 PROMPT MESTRE - INICIALIZAÇÃO CLAUDE CODE

```
Olá Claude! Sou desenvolvedor de um sistema revolucionário de gestão para clínicas de fisioterapia chamado FisioFlow.

CONTEXTO DO PROJETO:
- Sistema inovador focado em exercícios em grupos (primeiro mundial)
- Inspirado no Lumi Dashboard e Physitrack
- Gamificação social para aumentar aderência
- IA preditiva para identificar pacientes em risco
- ROI comprovado de 2.811%

OBJETIVO:
Desenvolver sistema completo usando suas capacidades avançadas de programação, com código limpo, arquitetura escalável e melhores práticas.

STACK TECNOLÓGICA PREFERIDA:
- Backend: Python/Flask ou FastAPI
- Frontend: React/TypeScript ou Vue.js
- Database: PostgreSQL + Redis (cache)
- Deploy: Docker + Kubernetes ou Heroku
- APIs: RESTful + GraphQL
- Real-time: WebSockets
- Testing: Pytest + Jest

FUNCIONALIDADES CORE:
1. Sistema de exercícios em grupos (INOVAÇÃO)
2. Gamificação social colaborativa
3. IA para predição de aderência
4. Chat em tempo real
5. Analytics avançado
6. Área do paciente mobile-first
7. Sistema de mentoria integrado

DIFERENCIAIS TÉCNICOS:
- Arquitetura microserviços
- Clean Architecture
- TDD (Test-Driven Development)
- CI/CD automatizado
- Monitoramento e observabilidade
- Segurança LGPD/HIPAA

Você pode me ajudar a criar este sistema com excelência técnica?
```

## 🏗️ PROMPT 1: ARQUITETURA E ESTRUTURA BASE

```
PROMPT 1: ARQUITETURA CLEAN E ESTRUTURA DO PROJETO

Crie arquitetura completa seguindo Clean Architecture e Domain-Driven Design:

ESTRUTURA DO PROJETO:
```
fisioflow/
├── src/
│   ├── domain/                 # Regras de negócio
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── value_objects/
│   ├── infrastructure/         # Implementações técnicas
│   │   ├── database/
│   │   ├── external_apis/
│   │   ├── messaging/
│   │   └── storage/
│   ├── application/           # Casos de uso
│   │   ├── use_cases/
│   │   ├── dto/
│   │   └── interfaces/
│   ├── presentation/          # Controllers e UI
│   │   ├── api/
│   │   ├── web/
│   │   └── websockets/
│   └── shared/               # Utilitários compartilhados
│       ├── exceptions/
│       ├── validators/
│       └── utils/
├── tests/
├── docs/
├── docker/
└── scripts/
```

DOMAIN ENTITIES:
```python
# src/domain/entities/patient.py
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from uuid import UUID

@dataclass
class Patient:
    id: UUID
    name: str
    email: str
    phone: str
    birth_date: datetime
    medical_conditions: List[str]
    emergency_contact: dict
    fisioterapeuta_id: UUID
    created_at: datetime
    updated_at: datetime
    
    def calculate_age(self) -> int:
        today = datetime.now()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
    
    def is_eligible_for_group(self, group_requirements: dict) -> bool:
        # Lógica de negócio para elegibilidade em grupos
        age = self.calculate_age()
        return (
            group_requirements.get('min_age', 0) <= age <= group_requirements.get('max_age', 120) and
            not any(condition in self.medical_conditions for condition in group_requirements.get('excluded_conditions', []))
        )

# src/domain/entities/group_session.py
@dataclass
class GroupSession:
    id: UUID
    name: str
    description: str
    fisioterapeuta_id: UUID
    max_capacity: int
    current_members: List[UUID]
    exercises: List[UUID]
    schedule: dict
    status: str
    created_at: datetime
    
    def add_member(self, patient_id: UUID) -> bool:
        if len(self.current_members) >= self.max_capacity:
            raise ValueError("Group is at maximum capacity")
        
        if patient_id in self.current_members:
            raise ValueError("Patient already in group")
        
        self.current_members.append(patient_id)
        return True
    
    def remove_member(self, patient_id: UUID) -> bool:
        if patient_id not in self.current_members:
            raise ValueError("Patient not in group")
        
        self.current_members.remove(patient_id)
        return True
    
    def is_available_slot(self) -> bool:
        return len(self.current_members) < self.max_capacity
```

REPOSITORY INTERFACES:
```python
# src/domain/repositories/patient_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from ..entities.patient import Patient

class PatientRepository(ABC):
    @abstractmethod
    async def create(self, patient: Patient) -> Patient:
        pass
    
    @abstractmethod
    async def get_by_id(self, patient_id: UUID) -> Optional[Patient]:
        pass
    
    @abstractmethod
    async def get_by_fisioterapeuta(self, fisioterapeuta_id: UUID) -> List[Patient]:
        pass
    
    @abstractmethod
    async def update(self, patient: Patient) -> Patient:
        pass
    
    @abstractmethod
    async def delete(self, patient_id: UUID) -> bool:
        pass
    
    @abstractmethod
    async def search(self, criteria: dict) -> List[Patient]:
        pass
```

USE CASES:
```python
# src/application/use_cases/create_group_session.py
from dataclasses import dataclass
from uuid import UUID
from typing import List
from ..dto.group_session_dto import CreateGroupSessionDTO
from ...domain.entities.group_session import GroupSession
from ...domain.repositories.group_session_repository import GroupSessionRepository
from ...domain.services.group_matching_service import GroupMatchingService

@dataclass
class CreateGroupSessionUseCase:
    group_repository: GroupSessionRepository
    matching_service: GroupMatchingService
    
    async def execute(self, dto: CreateGroupSessionDTO) -> GroupSession:
        # Validar dados de entrada
        self._validate_input(dto)
        
        # Criar entidade do grupo
        group = GroupSession(
            id=UUID(),
            name=dto.name,
            description=dto.description,
            fisioterapeuta_id=dto.fisioterapeuta_id,
            max_capacity=dto.max_capacity,
            current_members=[],
            exercises=dto.exercises,
            schedule=dto.schedule,
            status='active',
            created_at=datetime.now()
        )
        
        # Salvar no repositório
        created_group = await self.group_repository.create(group)
        
        # Sugerir pacientes compatíveis
        suggested_patients = await self.matching_service.find_compatible_patients(
            group_requirements=dto.requirements
        )
        
        return created_group
    
    def _validate_input(self, dto: CreateGroupSessionDTO) -> None:
        if not dto.name or len(dto.name.strip()) < 3:
            raise ValueError("Group name must have at least 3 characters")
        
        if dto.max_capacity < 2 or dto.max_capacity > 15:
            raise ValueError("Group capacity must be between 2 and 15")
```

API CONTROLLERS:
```python
# src/presentation/api/controllers/group_controller.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from ....application.use_cases.create_group_session import CreateGroupSessionUseCase
from ....application.dto.group_session_dto import CreateGroupSessionDTO, GroupSessionResponseDTO
from ...dependencies import get_current_user, get_group_use_cases

router = APIRouter(prefix="/api/v1/groups", tags=["groups"])

@router.post("/", response_model=GroupSessionResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: CreateGroupSessionDTO,
    current_user=Depends(get_current_user),
    use_cases=Depends(get_group_use_cases)
):
    try:
        # Verificar permissões
        if current_user.role not in ['admin', 'fisioterapeuta']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Executar caso de uso
        group = await use_cases.create_group.execute(group_data)
        
        return GroupSessionResponseDTO.from_entity(group)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{group_id}", response_model=GroupSessionResponseDTO)
async def get_group(
    group_id: UUID,
    current_user=Depends(get_current_user),
    use_cases=Depends(get_group_use_cases)
):
    group = await use_cases.get_group.execute(group_id)
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    return GroupSessionResponseDTO.from_entity(group)
```

TESTES UNITÁRIOS:
```python
# tests/unit/test_create_group_session.py
import pytest
from unittest.mock import Mock, AsyncMock
from uuid import uuid4
from datetime import datetime

from src.application.use_cases.create_group_session import CreateGroupSessionUseCase
from src.application.dto.group_session_dto import CreateGroupSessionDTO
from src.domain.entities.group_session import GroupSession

@pytest.fixture
def mock_repository():
    return Mock()

@pytest.fixture
def mock_matching_service():
    return Mock()

@pytest.fixture
def use_case(mock_repository, mock_matching_service):
    return CreateGroupSessionUseCase(
        group_repository=mock_repository,
        matching_service=mock_matching_service
    )

@pytest.mark.asyncio
async def test_create_group_session_success(use_case, mock_repository, mock_matching_service):
    # Arrange
    dto = CreateGroupSessionDTO(
        name="Grupo Pilates Iniciante",
        description="Grupo para iniciantes em pilates",
        fisioterapeuta_id=uuid4(),
        max_capacity=8,
        exercises=[uuid4(), uuid4()],
        schedule={"days": ["monday", "wednesday"], "time": "14:00"},
        requirements={"min_age": 18, "max_age": 65}
    )
    
    expected_group = GroupSession(
        id=uuid4(),
        name=dto.name,
        description=dto.description,
        fisioterapeuta_id=dto.fisioterapeuta_id,
        max_capacity=dto.max_capacity,
        current_members=[],
        exercises=dto.exercises,
        schedule=dto.schedule,
        status='active',
        created_at=datetime.now()
    )
    
    mock_repository.create = AsyncMock(return_value=expected_group)
    mock_matching_service.find_compatible_patients = AsyncMock(return_value=[])
    
    # Act
    result = await use_case.execute(dto)
    
    # Assert
    assert result.name == dto.name
    assert result.max_capacity == dto.max_capacity
    assert result.status == 'active'
    mock_repository.create.assert_called_once()
    mock_matching_service.find_compatible_patients.assert_called_once()

@pytest.mark.asyncio
async def test_create_group_session_invalid_name(use_case):
    # Arrange
    dto = CreateGroupSessionDTO(
        name="AB",  # Nome muito curto
        description="Descrição válida",
        fisioterapeuta_id=uuid4(),
        max_capacity=8,
        exercises=[],
        schedule={},
        requirements={}
    )
    
    # Act & Assert
    with pytest.raises(ValueError, match="Group name must have at least 3 characters"):
        await use_case.execute(dto)
```

Implemente com foco em qualidade, testabilidade e manutenibilidade.
```

## 🎮 PROMPT 2: SISTEMA DE GAMIFICAÇÃO AVANÇADO

```
PROMPT 2: GAMIFICAÇÃO SOCIAL COM ALGORITMOS INTELIGENTES

Desenvolva sistema completo de gamificação com algoritmos avançados:

DOMAIN SERVICES:
```python
# src/domain/services/gamification_service.py
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from uuid import UUID
import math

@dataclass
class PointsCalculationResult:
    base_points: int
    bonus_points: int
    total_points: int
    multiplier: float
    reason: str

class GamificationService:
    def __init__(self):
        self.point_rules = {
            'exercise_completed': 10,
            'group_session_attended': 25,
            'helped_teammate': 15,
            'daily_streak': 5,
            'weekly_goal_achieved': 50,
            'perfect_form_feedback': 20,
            'early_arrival': 5,
            'positive_attitude': 10
        }
        
        self.multipliers = {
            'beginner': 1.2,  # Bonus para iniciantes
            'comeback': 1.5,  # Bonus para quem volta após pausa
            'leader': 1.1,    # Bonus para líderes de grupo
            'mentor': 1.3     # Bonus para mentores
        }
    
    def calculate_session_points(
        self, 
        user_id: UUID, 
        session_data: dict, 
        user_context: dict
    ) -> PointsCalculationResult:
        base_points = 0
        bonus_points = 0
        applied_multipliers = []
        
        # Pontos base por exercícios completados
        completed_exercises = session_data.get('completed_exercises', 0)
        base_points += completed_exercises * self.point_rules['exercise_completed']
        
        # Pontos por participação na sessão
        if session_data.get('attended', False):
            base_points += self.point_rules['group_session_attended']
        
        # Bonus por qualidade da execução
        if session_data.get('average_form_score', 0) >= 8.0:
            bonus_points += self.point_rules['perfect_form_feedback']
        
        # Bonus por ajudar colegas
        helped_teammates = session_data.get('helped_teammates', 0)
        bonus_points += helped_teammates * self.point_rules['helped_teammate']
        
        # Bonus por chegada antecipada
        if session_data.get('arrived_early', False):
            bonus_points += self.point_rules['early_arrival']
        
        # Calcular multiplicadores
        total_multiplier = 1.0
        
        if user_context.get('is_beginner', False):
            total_multiplier *= self.multipliers['beginner']
            applied_multipliers.append('beginner')
        
        if user_context.get('is_comeback', False):
            total_multiplier *= self.multipliers['comeback']
            applied_multipliers.append('comeback')
        
        if user_context.get('is_group_leader', False):
            total_multiplier *= self.multipliers['leader']
            applied_multipliers.append('leader')
        
        # Aplicar multiplicadores
        total_before_multiplier = base_points + bonus_points
        total_points = int(total_before_multiplier * total_multiplier)
        
        return PointsCalculationResult(
            base_points=base_points,
            bonus_points=bonus_points,
            total_points=total_points,
            multiplier=total_multiplier,
            reason=f"Session completed with {', '.join(applied_multipliers) if applied_multipliers else 'no'} multipliers"
        )
    
    def calculate_streak_bonus(self, user_id: UUID, activity_history: List[datetime]) -> int:
        if not activity_history:
            return 0
        
        # Ordenar atividades por data
        sorted_activities = sorted(activity_history, reverse=True)
        
        # Calcular streak atual
        current_streak = 0
        current_date = datetime.now().date()
        
        for activity_date in sorted_activities:
            activity_day = activity_date.date()
            
            if activity_day == current_date:
                current_streak += 1
                current_date -= timedelta(days=1)
            elif activity_day == current_date:
                current_streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        # Calcular bonus baseado no streak
        if current_streak >= 7:
            return current_streak * self.point_rules['daily_streak'] * 2  # Bonus dobrado para streaks de 7+ dias
        elif current_streak >= 3:
            return current_streak * self.point_rules['daily_streak']
        
        return 0
    
    def determine_badge_eligibility(self, user_stats: dict) -> List[str]:
        eligible_badges = []
        
        # Badge de primeira sessão
        if user_stats.get('total_sessions', 0) == 1:
            eligible_badges.append('first_session')
        
        # Badge de consistência
        if user_stats.get('current_streak', 0) >= 15:
            eligible_badges.append('consistency_master')
        
        # Badge de colaboração
        if user_stats.get('teammates_helped', 0) >= 10:
            eligible_badges.append('team_player')
        
        # Badge de liderança
        if user_stats.get('leadership_score', 0) >= 80:
            eligible_badges.append('natural_leader')
        
        # Badge de progresso
        improvement_rate = user_stats.get('improvement_rate', 0)
        if improvement_rate >= 25:  # 25% de melhoria
            eligible_badges.append('rapid_improver')
        
        # Badge de mentor
        if user_stats.get('mentoring_sessions', 0) >= 5:
            eligible_badges.append('mentor')
        
        return eligible_badges

# src/domain/services/social_interaction_service.py
class SocialInteractionService:
    def __init__(self):
        self.interaction_weights = {
            'encouragement': 2.0,
            'help_request': 1.5,
            'tip_sharing': 2.5,
            'celebration': 1.0,
            'question': 1.0,
            'answer': 2.0
        }
    
    def calculate_social_score(self, interactions: List[dict]) -> float:
        total_score = 0.0
        
        for interaction in interactions:
            interaction_type = interaction.get('type', 'general')
            weight = self.interaction_weights.get(interaction_type, 1.0)
            
            # Considerar qualidade da interação (likes, responses)
            quality_multiplier = 1.0 + (interaction.get('likes', 0) * 0.1)
            quality_multiplier += interaction.get('responses', 0) * 0.2
            
            # Considerar recência da interação
            days_ago = (datetime.now() - interaction.get('created_at', datetime.now())).days
            recency_multiplier = max(0.1, 1.0 - (days_ago * 0.1))
            
            interaction_score = weight * quality_multiplier * recency_multiplier
            total_score += interaction_score
        
        return min(total_score, 100.0)  # Cap em 100
    
    def suggest_interactions(self, user_id: UUID, group_context: dict) -> List[dict]:
        suggestions = []
        
        # Sugerir parabenizar colegas com conquistas recentes
        recent_achievements = group_context.get('recent_achievements', [])
        for achievement in recent_achievements:
            if achievement['user_id'] != user_id:
                suggestions.append({
                    'type': 'celebration',
                    'target_user': achievement['user_id'],
                    'message_template': f"Parabéns pela conquista: {achievement['badge_name']}! 🎉",
                    'priority': 'high'
                })
        
        # Sugerir ajudar colegas com dificuldades
        struggling_members = group_context.get('struggling_members', [])
        for member in struggling_members:
            if member['user_id'] != user_id:
                suggestions.append({
                    'type': 'encouragement',
                    'target_user': member['user_id'],
                    'message_template': f"Oi {member['name']}! Vi que você está enfrentando alguns desafios. Posso ajudar?",
                    'priority': 'medium'
                })
        
        return suggestions
```

ALGORITMO DE MATCHING DE GRUPOS:
```python
# src/domain/services/group_matching_service.py
import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class MatchingScore:
    patient_id: UUID
    compatibility_score: float
    factors: Dict[str, float]
    recommendation_strength: str

class GroupMatchingService:
    def __init__(self):
        self.compatibility_weights = {
            'age_similarity': 0.15,
            'condition_compatibility': 0.25,
            'fitness_level': 0.20,
            'schedule_availability': 0.15,
            'personality_match': 0.10,
            'goals_alignment': 0.15
        }
    
    async def find_optimal_group_composition(
        self, 
        available_patients: List[dict], 
        group_requirements: dict,
        max_group_size: int = 8
    ) -> List[UUID]:
        # Calcular matriz de compatibilidade
        compatibility_matrix = self._calculate_compatibility_matrix(available_patients)
        
        # Usar algoritmo genético para otimização
        optimal_composition = self._genetic_algorithm_optimization(
            available_patients,
            compatibility_matrix,
            group_requirements,
            max_group_size
        )
        
        return optimal_composition
    
    def _calculate_compatibility_matrix(self, patients: List[dict]) -> np.ndarray:
        n = len(patients)
        matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i + 1, n):
                compatibility = self._calculate_pairwise_compatibility(
                    patients[i], 
                    patients[j]
                )
                matrix[i][j] = compatibility
                matrix[j][i] = compatibility
        
        return matrix
    
    def _calculate_pairwise_compatibility(self, patient1: dict, patient2: dict) -> float:
        total_score = 0.0
        
        # Similaridade de idade
        age_diff = abs(patient1['age'] - patient2['age'])
        age_score = max(0, 1 - (age_diff / 30))  # Normalizar por 30 anos
        total_score += age_score * self.compatibility_weights['age_similarity']
        
        # Compatibilidade de condições
        conditions1 = set(patient1.get('conditions', []))
        conditions2 = set(patient2.get('conditions', []))
        
        # Verificar se há condições incompatíveis
        incompatible_pairs = [
            ('acute_injury', 'chronic_pain'),
            ('post_surgery', 'high_intensity_training')
        ]
        
        has_incompatible = any(
            (c1 in conditions1 and c2 in conditions2) or 
            (c2 in conditions1 and c1 in conditions2)
            for c1, c2 in incompatible_pairs
        )
        
        condition_score = 0.0 if has_incompatible else 0.8
        
        # Bonus por condições similares
        common_conditions = conditions1.intersection(conditions2)
        if common_conditions:
            condition_score += 0.2
        
        total_score += condition_score * self.compatibility_weights['condition_compatibility']
        
        # Nível de fitness
        fitness_diff = abs(patient1.get('fitness_level', 5) - patient2.get('fitness_level', 5))
        fitness_score = max(0, 1 - (fitness_diff / 10))
        total_score += fitness_score * self.compatibility_weights['fitness_level']
        
        # Disponibilidade de horário
        schedule1 = set(patient1.get('available_times', []))
        schedule2 = set(patient2.get('available_times', []))
        schedule_overlap = len(schedule1.intersection(schedule2)) / max(len(schedule1.union(schedule2)), 1)
        total_score += schedule_overlap * self.compatibility_weights['schedule_availability']
        
        # Personalidade (baseado em questionário)
        personality_score = self._calculate_personality_compatibility(
            patient1.get('personality_profile', {}),
            patient2.get('personality_profile', {})
        )
        total_score += personality_score * self.compatibility_weights['personality_match']
        
        # Alinhamento de objetivos
        goals1 = set(patient1.get('goals', []))
        goals2 = set(patient2.get('goals', []))
        goals_overlap = len(goals1.intersection(goals2)) / max(len(goals1.union(goals2)), 1)
        total_score += goals_overlap * self.compatibility_weights['goals_alignment']
        
        return min(total_score, 1.0)
    
    def _genetic_algorithm_optimization(
        self, 
        patients: List[dict], 
        compatibility_matrix: np.ndarray,
        requirements: dict,
        max_size: int
    ) -> List[UUID]:
        # Implementação simplificada de algoritmo genético
        population_size = 50
        generations = 100
        mutation_rate = 0.1
        
        # Gerar população inicial
        population = self._generate_initial_population(
            patients, requirements, max_size, population_size
        )
        
        for generation in range(generations):
            # Avaliar fitness de cada indivíduo
            fitness_scores = [
                self._evaluate_group_fitness(group, compatibility_matrix)
                for group in population
            ]
            
            # Seleção dos melhores
            selected = self._tournament_selection(population, fitness_scores)
            
            # Crossover e mutação
            new_population = []
            for i in range(0, len(selected), 2):
                if i + 1 < len(selected):
                    child1, child2 = self._crossover(selected[i], selected[i + 1])
                    new_population.extend([
                        self._mutate(child1, mutation_rate),
                        self._mutate(child2, mutation_rate)
                    ])
            
            population = new_population[:population_size]
        
        # Retornar melhor solução
        final_fitness = [
            self._evaluate_group_fitness(group, compatibility_matrix)
            for group in population
        ]
        best_group_index = np.argmax(final_fitness)
        
        return [patients[i]['id'] for i in population[best_group_index]]
    
    def _evaluate_group_fitness(self, group_indices: List[int], compatibility_matrix: np.ndarray) -> float:
        if len(group_indices) < 2:
            return 0.0
        
        total_compatibility = 0.0
        pair_count = 0
        
        for i in range(len(group_indices)):
            for j in range(i + 1, len(group_indices)):
                total_compatibility += compatibility_matrix[group_indices[i]][group_indices[j]]
                pair_count += 1
        
        return total_compatibility / pair_count if pair_count > 0 else 0.0
```

SISTEMA DE DESAFIOS DINÂMICOS:
```python
# src/domain/services/challenge_service.py
class ChallengeService:
    def __init__(self):
        self.challenge_templates = {
            'individual': [
                {
                    'name': 'Streak Master',
                    'description': 'Complete exercícios por {days} dias consecutivos',
                    'type': 'streak',
                    'difficulty': 'medium',
                    'reward_points': 100,
                    'parameters': {'days': [3, 5, 7, 10, 15]}
                },
                {
                    'name': 'Form Perfect',
                    'description': 'Mantenha pontuação de forma acima de {score} por {sessions} sessões',
                    'type': 'form_quality',
                    'difficulty': 'hard',
                    'reward_points': 150,
                    'parameters': {'score': [8.0, 8.5, 9.0], 'sessions': [3, 5, 7]}
                }
            ],
            'group': [
                {
                    'name': 'Team Spirit',
                    'description': 'Grupo alcançar {attendance}% de presença por {weeks} semanas',
                    'type': 'group_attendance',
                    'difficulty': 'medium',
                    'reward_points': 200,
                    'parameters': {'attendance': [80, 85, 90], 'weeks': [2, 3, 4]}
                },
                {
                    'name': 'Mutual Support',
                    'description': 'Cada membro ajudar pelo menos {helps} colegas esta semana',
                    'type': 'mutual_help',
                    'difficulty': 'easy',
                    'reward_points': 75,
                    'parameters': {'helps': [2, 3, 5]}
                }
            ]
        }
    
    def generate_personalized_challenges(
        self, 
        user_id: UUID, 
        user_stats: dict, 
        group_context: dict
    ) -> List[dict]:
        challenges = []
        
        # Desafios individuais baseados no histórico
        individual_challenges = self._generate_individual_challenges(user_stats)
        challenges.extend(individual_challenges)
        
        # Desafios de grupo baseados na dinâmica do grupo
        if group_context:
            group_challenges = self._generate_group_challenges(group_context)
            challenges.extend(group_challenges)
        
        # Desafios adaptativos baseados em dificuldades
        adaptive_challenges = self._generate_adaptive_challenges(user_stats)
        challenges.extend(adaptive_challenges)
        
        return challenges[:5]  # Limitar a 5 desafios ativos
    
    def _generate_individual_challenges(self, user_stats: dict) -> List[dict]:
        challenges = []
        current_streak = user_stats.get('current_streak', 0)
        
        # Desafio de streak baseado no histórico
        if current_streak < 3:
            target_days = 3
        elif current_streak < 7:
            target_days = 7
        else:
            target_days = current_streak + 3
        
        challenges.append({
            'id': str(uuid4()),
            'name': f'Streak de {target_days} dias',
            'description': f'Complete exercícios por {target_days} dias consecutivos',
            'type': 'individual_streak',
            'target': target_days,
            'current_progress': current_streak,
            'reward_points': target_days * 20,
            'expires_at': datetime.now() + timedelta(days=target_days + 7)
        })
        
        return challenges
```

Implemente com foco em engajamento, motivação e algoritmos inteligentes.
```

## 🤖 PROMPT 3: IA PREDITIVA E MACHINE LEARNING

```
PROMPT 3: SISTEMA DE IA PREDITIVA PARA ADERÊNCIA

Desenvolva sistema completo de IA para predição e insights:

MODELO DE PREDIÇÃO DE ADERÊNCIA:
```python
# src/domain/services/ai_prediction_service.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
from typing import Dict, List, Tuple, Optional
import joblib
from datetime import datetime, timedelta

class AdherencePredictionService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_importance = {}
        self.model_metrics = {}
        
    def prepare_features(self, patient_data: dict) -> np.ndarray:
        """Preparar features para predição"""
        features = []
        
        # Features demográficas
        features.append(patient_data.get('age', 0))
        features.append(1 if patient_data.get('gender') == 'female' else 0)
        
        # Features médicas
        conditions = patient_data.get('medical_conditions', [])
        features.append(len(conditions))  # Número de condições
        features.append(1 if 'chronic_pain' in conditions else 0)
        features.append(1 if 'post_surgery' in conditions else 0)
        features.append(1 if 'sports_injury' in conditions else 0)
        
        # Features de histórico
        features.append(patient_data.get('previous_therapy_experience', 0))
        features.append(patient_data.get('initial_pain_level', 5))
        features.append(patient_data.get('motivation_score', 5))
        
        # Features comportamentais
        features.append(patient_data.get('sessions_attended', 0))
        features.append(patient_data.get('sessions_missed', 0))
        features.append(patient_data.get('late_arrivals', 0))
        features.append(patient_data.get('early_departures', 0))
        
        # Features de engajamento
        features.append(patient_data.get('app_usage_frequency', 0))
        features.append(patient_data.get('exercise_completion_rate', 0))
        features.append(patient_data.get('social_interactions', 0))
        features.append(patient_data.get('feedback_provided', 0))
        
        # Features temporais
        days_in_program = (datetime.now() - patient_data.get('start_date', datetime.now())).days
        features.append(days_in_program)
        features.append(patient_data.get('current_streak', 0))
        features.append(patient_data.get('longest_streak', 0))
        
        # Features de progresso
        features.append(patient_data.get('pain_improvement', 0))
        features.append(patient_data.get('functional_improvement', 0))
        features.append(patient_data.get('satisfaction_score', 5))
        
        # Features de grupo
        features.append(patient_data.get('group_size', 0))
        features.append(patient_data.get('group_cohesion_score', 0))
        features.append(patient_data.get('peer_support_received', 0))
        
        return np.array(features).reshape(1, -1)
    
    def train_model(self, training_data: List[dict]) -> Dict:
        """Treinar modelo de predição"""
        # Preparar dados
        X = []
        y = []
        
        for patient in training_data:
            features = self.prepare_features(patient).flatten()
            X.append(features)
            
            # Label: 1 se aderência > 80%, 0 caso contrário
            adherence_rate = patient.get('adherence_rate', 0)
            y.append(1 if adherence_rate > 0.8 else 0)
        
        X = np.array(X)
        y = np.array(y)
        
        # Dividir dados
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Normalizar features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Treinar ensemble de modelos
        models = {
            'random_forest': RandomForestClassifier(
                n_estimators=100, 
                max_depth=10, 
                random_state=42
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=100, 
                learning_rate=0.1, 
                random_state=42
            )
        }
        
        best_model = None
        best_score = 0
        
        for name, model in models.items():
            # Treinar modelo
            model.fit(X_train_scaled, y_train)
            
            # Validação cruzada
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            avg_score = cv_scores.mean()
            
            if avg_score > best_score:
                best_score = avg_score
                best_model = model
                self.model = model
        
        # Avaliar no conjunto de teste
        y_pred = self.model.predict(X_test_scaled)
        
        # Calcular métricas
        self.model_metrics = {
            'accuracy': self.model.score(X_test_scaled, y_test),
            'cv_score': best_score,
            'classification_report': classification_report(y_test, y_pred, output_dict=True),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
        }
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            feature_names = self._get_feature_names()
            self.feature_importance = dict(zip(
                feature_names, 
                self.model.feature_importances_
            ))
        
        # Salvar modelo
        self._save_model()
        
        return self.model_metrics
    
    def predict_adherence_risk(self, patient_data: dict) -> Dict:
        """Predizer risco de abandono"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Preparar features
        features = self.prepare_features(patient_data)
        features_scaled = self.scaler.transform(features)
        
        # Predição
        risk_probability = self.model.predict_proba(features_scaled)[0][0]  # Probabilidade de baixa aderência
        risk_class = self.model.predict(features_scaled)[0]
        
        # Determinar nível de risco
        if risk_probability > 0.7:
            risk_level = 'high'
            recommendation = 'Intervenção imediata necessária'
        elif risk_probability > 0.4:
            risk_level = 'medium'
            recommendation = 'Monitoramento próximo recomendado'
        else:
            risk_level = 'low'
            recommendation = 'Continuar acompanhamento regular'
        
        # Identificar fatores de risco principais
        risk_factors = self._identify_risk_factors(patient_data)
        
        return {
            'risk_probability': float(risk_probability),
            'risk_level': risk_level,
            'risk_class': int(risk_class),
            'recommendation': recommendation,
            'risk_factors': risk_factors,
            'confidence': float(max(risk_probability, 1 - risk_probability))
        }
    
    def _identify_risk_factors(self, patient_data: dict) -> List[Dict]:
        """Identificar principais fatores de risco"""
        risk_factors = []
        
        # Analisar cada fator baseado na importância das features
        if patient_data.get('sessions_missed', 0) > 2:
            risk_factors.append({
                'factor': 'high_absence_rate',
                'description': 'Alto número de faltas nas sessões',
                'severity': 'high',
                'suggestion': 'Conversar sobre barreiras para participação'
            })
        
        if patient_data.get('app_usage_frequency', 0) < 3:
            risk_factors.append({
                'factor': 'low_engagement',
                'description': 'Baixo uso do aplicativo',
                'severity': 'medium',
                'suggestion': 'Incentivar uso de funcionalidades gamificadas'
            })
        
        if patient_data.get('social_interactions', 0) < 2:
            risk_factors.append({
                'factor': 'social_isolation',
                'description': 'Pouca interação com grupo',
                'severity': 'medium',
                'suggestion': 'Facilitar conexões sociais no grupo'
            })
        
        if patient_data.get('pain_improvement', 0) < 20:
            risk_factors.append({
                'factor': 'slow_progress',
                'description': 'Progresso mais lento que esperado',
                'severity': 'high',
                'suggestion': 'Revisar plano de tratamento'
            })
        
        return risk_factors
    
    def generate_personalized_interventions(self, risk_assessment: Dict, patient_data: dict) -> List[Dict]:
        """Gerar intervenções personalizadas"""
        interventions = []
        
        risk_level = risk_assessment['risk_level']
        risk_factors = risk_assessment['risk_factors']
        
        # Intervenções baseadas no nível de risco
        if risk_level == 'high':
            interventions.append({
                'type': 'immediate_contact',
                'priority': 'urgent',
                'action': 'Contato telefônico nas próximas 24h',
                'responsible': 'fisioterapeuta',
                'description': 'Conversa individual para identificar barreiras'
            })
        
        # Intervenções baseadas em fatores específicos
        for factor in risk_factors:
            if factor['factor'] == 'high_absence_rate':
                interventions.append({
                    'type': 'schedule_adjustment',
                    'priority': 'high',
                    'action': 'Revisar disponibilidade de horários',
                    'responsible': 'recepção',
                    'description': 'Oferecer horários alternativos mais convenientes'
                })
            
            elif factor['factor'] == 'low_engagement':
                interventions.append({
                    'type': 'gamification_boost',
                    'priority': 'medium',
                    'action': 'Ativar desafios personalizados',
                    'responsible': 'sistema',
                    'description': 'Criar desafios mais fáceis para gerar momentum'
                })
            
            elif factor['factor'] == 'social_isolation':
                interventions.append({
                    'type': 'social_facilitation',
                    'priority': 'medium',
                    'action': 'Apresentar a colegas compatíveis',
                    'responsible': 'fisioterapeuta',
                    'description': 'Facilitar conexões com membros similares do grupo'
                })
        
        return interventions

# src/domain/services/recommendation_service.py
class ExerciseRecommendationService:
    def __init__(self):
        self.collaborative_model = None
        self.content_model = None
        
    def train_collaborative_filtering(self, interaction_data: List[dict]):
        """Treinar modelo de filtragem colaborativa"""
        from sklearn.decomposition import NMF
        
        # Criar matriz usuário-exercício
        user_exercise_matrix = self._create_interaction_matrix(interaction_data)
        
        # Treinar modelo NMF
        self.collaborative_model = NMF(n_components=50, random_state=42)
        self.collaborative_model.fit(user_exercise_matrix)
        
    def recommend_exercises(
        self, 
        patient_id: UUID, 
        patient_profile: dict, 
        n_recommendations: int = 10
    ) -> List[Dict]:
        """Recomendar exercícios personalizados"""
        
        # Recomendações baseadas em conteúdo
        content_recs = self._content_based_recommendations(patient_profile)
        
        # Recomendações colaborativas
        collaborative_recs = self._collaborative_recommendations(patient_id)
        
        # Combinar recomendações
        combined_recs = self._combine_recommendations(
            content_recs, 
            collaborative_recs,
            weights={'content': 0.6, 'collaborative': 0.4}
        )
        
        # Aplicar filtros de segurança
        safe_recs = self._apply_safety_filters(combined_recs, patient_profile)
        
        return safe_recs[:n_recommendations]
    
    def _content_based_recommendations(self, patient_profile: dict) -> List[Dict]:
        """Recomendações baseadas no perfil do paciente"""
        recommendations = []
        
        conditions = patient_profile.get('medical_conditions', [])
        fitness_level = patient_profile.get('fitness_level', 5)
        goals = patient_profile.get('goals', [])
        
        # Lógica de recomendação baseada em regras
        if 'lower_back_pain' in conditions:
            recommendations.extend([
                {'exercise_id': 'core_strengthening', 'score': 0.9},
                {'exercise_id': 'pelvic_tilt', 'score': 0.8},
                {'exercise_id': 'cat_cow_stretch', 'score': 0.85}
            ])
        
        if 'knee_injury' in conditions:
            recommendations.extend([
                {'exercise_id': 'quad_strengthening', 'score': 0.9},
                {'exercise_id': 'hamstring_stretch', 'score': 0.8},
                {'exercise_id': 'calf_raises', 'score': 0.7}
            ])
        
        # Ajustar baseado no nível de fitness
        for rec in recommendations:
            if fitness_level < 3:
                rec['score'] *= 0.8  # Exercícios mais suaves
            elif fitness_level > 7:
                rec['score'] *= 1.2  # Exercícios mais desafiadores
        
        return recommendations
    
    def _apply_safety_filters(self, recommendations: List[Dict], patient_profile: dict) -> List[Dict]:
        """Aplicar filtros de segurança"""
        safe_recs = []
        
        contraindications = patient_profile.get('contraindications', [])
        recent_injuries = patient_profile.get('recent_injuries', [])
        
        for rec in recommendations:
            exercise_id = rec['exercise_id']
            
            # Verificar contraindicações
            if not self._has_contraindications(exercise_id, contraindications):
                # Verificar lesões recentes
                if not self._conflicts_with_injuries(exercise_id, recent_injuries):
                    safe_recs.append(rec)
        
        return safe_recs
```

SISTEMA DE INSIGHTS AUTOMÁTICOS:
```python
# src/domain/services/insights_service.py
class ClinicalInsightsService:
    def __init__(self):
        self.insight_generators = {
            'adherence_trends': self._analyze_adherence_trends,
            'group_dynamics': self._analyze_group_dynamics,
            'exercise_effectiveness': self._analyze_exercise_effectiveness,
            'patient_progress': self._analyze_patient_progress,
            'resource_optimization': self._analyze_resource_usage
        }
    
    def generate_weekly_insights(self, clinic_data: dict) -> List[Dict]:
        """Gerar insights semanais automáticos"""
        insights = []
        
        for insight_type, generator in self.insight_generators.items():
            try:
                insight = generator(clinic_data)
                if insight:
                    insights.append(insight)
            except Exception as e:
                # Log error but continue with other insights
                print(f"Error generating {insight_type}: {e}")
        
        # Priorizar insights por impacto
        insights.sort(key=lambda x: x.get('impact_score', 0), reverse=True)
        
        return insights
    
    def _analyze_adherence_trends(self, clinic_data: dict) -> Dict:
        """Analisar tendências de aderência"""
        adherence_data = clinic_data.get('adherence_rates', [])
        
        if len(adherence_data) < 4:  # Precisa de pelo menos 4 semanas
            return None
        
        # Calcular tendência
        recent_avg = np.mean(adherence_data[-2:])
        previous_avg = np.mean(adherence_data[-4:-2])
        trend = (recent_avg - previous_avg) / previous_avg * 100
        
        if abs(trend) < 5:  # Mudança insignificante
            return None
        
        insight = {
            'type': 'adherence_trends',
            'title': 'Tendência de Aderência Detectada',
            'impact_score': abs(trend) * 2,
            'trend_direction': 'increasing' if trend > 0 else 'decreasing',
            'trend_magnitude': abs(trend),
            'current_rate': recent_avg,
            'previous_rate': previous_avg
        }
        
        if trend > 10:
            insight['message'] = f"Excelente! A aderência aumentou {trend:.1f}% nas últimas semanas."
            insight['action'] = "Identificar e replicar fatores de sucesso"
            insight['priority'] = 'celebrate'
        elif trend < -10:
            insight['message'] = f"Atenção: A aderência diminuiu {abs(trend):.1f}% nas últimas semanas."
            insight['action'] = "Investigar causas e implementar intervenções"
            insight['priority'] = 'urgent'
        
        return insight
    
    def _analyze_group_dynamics(self, clinic_data: dict) -> Dict:
        """Analisar dinâmica dos grupos"""
        groups_data = clinic_data.get('groups', [])
        
        high_performing_groups = []
        struggling_groups = []
        
        for group in groups_data:
            group_score = self._calculate_group_performance_score(group)
            
            if group_score > 8.0:
                high_performing_groups.append(group)
            elif group_score < 6.0:
                struggling_groups.append(group)
        
        if not high_performing_groups and not struggling_groups:
            return None
        
        insight = {
            'type': 'group_dynamics',
            'title': 'Análise de Performance dos Grupos',
            'impact_score': len(struggling_groups) * 15 + len(high_performing_groups) * 10
        }
        
        if high_performing_groups:
            best_group = max(high_performing_groups, key=lambda g: g['performance_score'])
            insight['success_story'] = {
                'group_name': best_group['name'],
                'score': best_group['performance_score'],
                'key_factors': self._identify_success_factors(best_group)
            }
        
        if struggling_groups:
            insight['concerns'] = [
                {
                    'group_name': group['name'],
                    'issues': self._identify_group_issues(group),
                    'recommendations': self._generate_group_recommendations(group)
                }
                for group in struggling_groups
            ]
            insight['priority'] = 'high'
        
        return insight
    
    def _calculate_group_performance_score(self, group: dict) -> float:
        """Calcular score de performance do grupo"""
        factors = {
            'adherence_rate': group.get('adherence_rate', 0) / 100 * 0.3,
            'satisfaction_score': group.get('satisfaction_score', 0) / 10 * 0.2,
            'social_cohesion': group.get('social_cohesion_score', 0) / 10 * 0.2,
            'progress_rate': group.get('average_progress', 0) / 100 * 0.2,
            'retention_rate': group.get('retention_rate', 0) / 100 * 0.1
        }
        
        return sum(factors.values()) * 10  # Escala 0-10
```

Implemente com foco em precisão, interpretabilidade e ações práticas.
```

Desenvolva sistema completo de IA com modelos preditivos e insights acionáveis.

