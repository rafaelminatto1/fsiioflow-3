'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Download, 
  MoreVertical,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity
} from 'lucide-react'
import { usePatients } from '../hooks/usePatients'
import { PatientWithDetails } from '@/types/prisma'
import { formatDate, formatCPF, formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PatientListProps {
  onPatientSelect?: (patient: PatientWithDetails) => void
  onPatientEdit?: (patient: PatientWithDetails) => void
  onPatientView?: (patient: PatientWithDetails) => void
  onNewPatient?: () => void
  selectionMode?: boolean
  selectedPatients?: string[]
  onSelectionChange?: (patientIds: string[]) => void
}

export function PatientList({
  onPatientSelect,
  onPatientEdit,
  onPatientView,
  onNewPatient,
  selectionMode = false,
  selectedPatients = [],
  onSelectionChange
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    isActive: true,
    physiotherapistId: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastAppointment'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const {
    patients,
    isLoading,
    error,
    total,
    currentPage,
    pageSize,
    searchPatients,
    goToPage,
    changePageSize
  } = usePatients()

  // Buscar pacientes quando filtros mudarem
  useEffect(() => {
    const searchFilters = {
      search: searchTerm,
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined
    }
    
    const debounceTimer = setTimeout(() => {
      searchPatients(searchFilters)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, filters, searchPatients])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleSelectPatient = (patientId: string) => {
    if (!onSelectionChange) return

    const newSelection = selectedPatients.includes(patientId)
      ? selectedPatients.filter(id => id !== patientId)
      : [...selectedPatients, patientId]
    
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return

    const allSelected = selectedPatients.length === patients.length
    onSelectionChange(allSelected ? [] : patients.map(p => p.id))
  }

  const getPatientAge = (birthDate: Date) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const getLastAppointmentDate = (patient: PatientWithDetails) => {
    if (!patient.appointments || patient.appointments.length === 0) {
      return null
    }
    
    const sortedAppointments = patient.appointments.sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    )
    
    return new Date(sortedAppointments[0].dateTime)
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Erro ao carregar pacientes</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-gray-600">
            {total} paciente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        
        {onNewPatient && (
          <button
            onClick={onNewPatient}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </button>
        )}
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        {/* Barra de busca */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center px-3 py-2 border rounded-md transition-colors",
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.isActive ? 'active' : 'inactive'}
                onChange={(e) => handleFilterChange('isActive', e.target.value === 'active')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fisioterapeuta
              </label>
              <select
                value={filters.physiotherapistId}
                onChange={(e) => handleFilterChange('physiotherapistId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                {/* Lista de fisioterapeutas será carregada dinamicamente */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista de Pacientes */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Header da tabela */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center">
            {selectionMode && (
              <div className="w-4 mr-4">
                <input
                  type="checkbox"
                  checked={selectedPatients.length === patients.length && patients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-gray-700"
                >
                  Paciente
                  {sortBy === 'name' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </div>
              <div className="col-span-2">Contato</div>
              <div className="col-span-2">Idade</div>
              <div className="col-span-2">
                <button
                  onClick={() => handleSort('lastAppointment')}
                  className="flex items-center hover:text-gray-700"
                >
                  Última Consulta
                  {sortBy === 'lastAppointment' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Ações</div>
            </div>
          </div>
        </div>

        {/* Corpo da tabela */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum paciente encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || Object.values(filters).some(v => v)
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando um novo paciente'}
              </p>
            </div>
          ) : (
            patients.map((patient) => {
              const age = getPatientAge(patient.birthDate)
              const lastAppointment = getLastAppointmentDate(patient)
              const isSelected = selectedPatients.includes(patient.id)

              return (
                <div
                  key={patient.id}
                  className={cn(
                    "px-6 py-4 hover:bg-gray-50 transition-colors",
                    isSelected && "bg-blue-50"
                  )}
                >
                  <div className="flex items-center">
                    {selectionMode && (
                      <div className="w-4 mr-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectPatient(patient.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      {/* Paciente */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {patient.user.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              CPF: {formatCPF(patient.cpf)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contato */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-1 text-gray-400" />
                          {formatPhone(patient.phone)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1 text-gray-400" />
                          {patient.email}
                        </div>
                      </div>

                      {/* Idade */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {age} anos
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(patient.birthDate)}
                        </div>
                      </div>

                      {/* Última Consulta */}
                      <div className="col-span-2">
                        {lastAppointment ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(lastAppointment)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.appointments?.[0]?.physiotherapist?.name}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Nenhuma consulta
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                          patient.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}>
                          {patient.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-2">
                          {onPatientView && (
                            <button
                              onClick={() => onPatientView(patient)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          
                          {onPatientEdit && (
                            <button
                              onClick={() => onPatientEdit(patient)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {onPatientSelect && (
                            <button
                              onClick={() => onPatientSelect(patient)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Selecionar"
                            >
                              <Activity className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Paginação */}
        {patients.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>Mostrando</span>
              <select
                value={pageSize}
                onChange={(e) => changePageSize(parseInt(e.target.value))}
                className="mx-2 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>de {total} pacientes</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-1 text-sm">
                Página {currentPage} de {Math.ceil(total / pageSize)}
              </span>
              
              <button
                onClick={() => goToPage(Math.min(Math.ceil(total / pageSize), currentPage + 1))}
                disabled={currentPage === Math.ceil(total / pageSize)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
