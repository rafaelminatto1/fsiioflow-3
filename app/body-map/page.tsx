'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { BodyMap } from '@/features/body-map/components/BodyMap'
import { usePatients } from '@/features/patients/hooks/usePatients'
import { Search, User } from 'lucide-react'

function BodyMapPageContent() {
  const searchParams = useSearchParams()
  const initialPatientId = searchParams?.get('patientId') || ''
  
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { patients, isLoading: loadingPatients, searchPatients } = usePatients()

  const handlePatientSearch = (term: string) => {
    setSearchTerm(term)
    if (term.length >= 2) {
      searchPatients({ search: term, limit: 10 })
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm)
  )

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mapa Corporal</h1>
          <p className="mt-2 text-gray-600">
            Visualize e gerencie pontos de dor dos pacientes
          </p>
        </div>

        {/* Seletor de Paciente */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Selecionar Paciente
            </h2>
            
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar paciente por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Lista de Pacientes */}
              {searchTerm.length >= 2 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {loadingPatients ? (
                    <div className="p-4 text-center text-gray-500">
                      Buscando pacientes...
                    </div>
                  ) : filteredPatients.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatientId(patient.id)
                            setSearchTerm('')
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {patient.user.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {patient.email} • CPF: {patient.cpf}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum paciente encontrado
                    </div>
                  )}
                </div>
              )}

              {/* Paciente Selecionado */}
              {selectedPatient && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Paciente selecionado: {selectedPatient.user.name}
                      </p>
                      <p className="text-sm text-blue-700">
                        {selectedPatient.email} • CPF: {selectedPatient.cpf}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatientId('')
                        setSearchTerm('')
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Alterar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapa Corporal */}
        {selectedPatientId ? (
          <BodyMap 
            patientId={selectedPatientId}
            showTimeline={true}
          />
        ) : (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecione um paciente
            </h3>
            <p className="text-gray-600">
              Use o campo de busca acima para encontrar e selecionar um paciente para visualizar o mapa corporal.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BodyMapPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_patients']}>
      <BodyMapPageContent />
    </ProtectedRoute>
  )
}
