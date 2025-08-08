
// tests/pages/PatientListPage.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from '../../pages/PatientListPage';
import { usePatients } from '../../hooks/usePatients';
import { Patient } from '../../types';

// Mock the custom hook
vi.mock('../../hooks/usePatients');

// Mock child components to isolate the test
vi.mock('../../components/PageHeader', () => ({
  default: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../components/PatientFormModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) =>
    isOpen ? (
      <div data-testid="patient-form-modal">
        Modal Aberto <button onClick={onClose}>Fechar</button>
      </div>
    ) : null,
}));

// Mock the Toast context used by the hook
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockUsePatients = usePatients as Mock;

describe('PatientListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <MemoryRouter>
        <PatientListPage />
      </MemoryRouter>
    );
  };

  it('deve renderizar o estado de carregamento corretamente', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: true, error: null });
    renderComponent();
    
    // Skeleton renders 5 rows, and the table has a header row.
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6); 
  });

  it('deve renderizar o estado de erro corretamente', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: new Error('Falha na API') });
    renderComponent();
    expect(screen.getByText(/Falha ao carregar pacientes/i)).toBeInTheDocument();
  });

  it('deve renderizar a lista de pacientes quando os dados são carregados', () => {
    const mockData: Patient[] = [
      { id: '1', name: 'Ana Beatriz Costa', cpf: '111', email: 'ana@email.com', phone: '123', status: 'Active', lastVisit: new Date().toISOString(), avatarUrl: '' , birthDate: '', emergencyContact: {name: '', phone:''}, address: { street: '', city: '', state: '', zip: ''}, consentGiven: true, registrationDate: '2023-10-01', whatsappConsent: 'opt-in' },
      { id: '2', name: 'Bruno Gomes', cpf: '222', email: 'bruno@email.com', phone: '456', status: 'Inactive', lastVisit: new Date().toISOString(), avatarUrl: '', birthDate: '', emergencyContact: {name: '', phone:''}, address: { street: '', city: '', state: '', zip: ''}, consentGiven: true, registrationDate: '2023-10-02', whatsappConsent: 'opt-in' },
    ];
    mockUsePatients.mockReturnValue({ patients: mockData, isLoading: false, error: null, addPatient: vi.fn() });
    
    renderComponent();
    expect(screen.getByText('Ana Beatriz Costa')).toBeInTheDocument();
    expect(screen.getByText('Bruno Gomes')).toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em "Novo Paciente"', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: null, addPatient: vi.fn() });
    
    renderComponent();
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('patient-form-modal')).not.toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /Novo Paciente/i });
    fireEvent.click(addButton);
    
    // Modal should now be visible
    expect(screen.getByTestId('patient-form-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Aberto')).toBeInTheDocument();
  });

   it('deve renderizar "Nenhum paciente encontrado" quando a lista estiver vazia', () => {
        mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: null });
        renderComponent();
        expect(screen.getByText(/Nenhum paciente encontrado/i)).toBeInTheDocument();
   });
});
