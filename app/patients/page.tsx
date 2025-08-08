'use client'

import React, { useState } from 'react'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { PatientList } from '@/features/patients/components/PatientList'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { usePatients } from '@/features/patients/hooks/usePatients'
import { PatientWithDetails, CreatePatientInput, UpdatePatientInput } from '@/types/prisma'
import { useRouter } from 'next/navigation'

function PatientsPageContent() {
  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const { createPatient, updatePatient } = usePatients()

  const handleNewPatient = () => {
    setEditingPatient(null)
    setShowForm(true)
  }

  const handleEditPatient = (patient: PatientWithDetails) => {
    setEditingPatient(patient)
    setShowForm(true)
  }

  const handleViewPatient = (patient: PatientWithDetails) => {
    router.push(`/patients/${patient.id}`)
  }

  const handleSavePatient = async (data: CreatePatientInput | UpdatePatientInput) => {
    setIsLoading(true)
    try {
      if (editingPatient) {
        // Atualizar paciente existente
        await updatePatient(editingPatient.id, data as UpdatePatientInput)
      } else {
        // Criar novo paciente
        await createPatient(data as CreatePatientInput)
      }
      
      setShowForm(false)
      setEditingPatient(null)
    } catch (error) {
      console.error('Erro ao salvar paciente:', error)
      // TODO: Mostrar toast de erro
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingPatient(null)
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PatientForm
            patient={editingPatient || undefined}
            onSave={handleSavePatient}
            onCancel={handleCancelForm}
            isLoading={isLoading}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PatientList
          onPatientEdit={handleEditPatient}
          onPatientView={handleViewPatient}
          onNewPatient={handleNewPatient}
        />
      </div>
    </div>
  )
}

export default function PatientsPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_patients']}>
      <PatientsPageContent />
    </ProtectedRoute>
  )
}
