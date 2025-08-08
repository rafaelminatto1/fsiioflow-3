'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Heart, 
  Activity,
  FileText,
  Pill,
  AlertTriangle,
  User,
  Briefcase,
  Clock
} from 'lucide-react'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { BodyMap } from '@/features/body-map/components/BodyMap'
import { usePatients } from '@/features/patients/hooks/usePatients'
import { PatientWithDetails } from '@/types/prisma'
import { formatDate, formatCPF, formatPhone, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

function PatientDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const patientId = params?.id as string
  
  const [patient, setPatient] = useState<PatientWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'body-map' | 'appointments' | 'prescriptions'>('overview')
  
  const { getPatientById } = usePatients()

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) return
      
      setIsLoading(true)
      try {
        const patientData = await getPatientById(patientId)
        setPatient(patientData)
      } catch (error) {
        console.error('Erro ao carregar paciente:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPatient()
  }, [patientId, getPatientById])

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

  const getNextAppointment = () => {
    if (!patient?.appointments) return null
    
    const futureAppointments = patient.appointments
      .filter(apt => new Date(apt.dateTime) > new Date())
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    
    return futureAppointments[0] || null
  }

  const getLastAppointment = () => {
    if (!patient?.appointments) return null
    
    const pastAppointments = patient.appointments
      .filter(apt => new Date(apt.dateTime) <= new Date())
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    
    return pastAppointments[0] || null
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'medical', label: 'Informações Médicas', icon: Heart },
    { id: 'body-map', label: 'Mapa Corporal', icon: Activity },
    { id: 'appointments', label: 'Consultas', icon: Calendar },
    { id: 'prescriptions', label: 'Prescrições', icon: FileText }
  ] as const

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paciente não encontrado</h1>
          <button
            onClick={() => router.push('/patients')}
            className="text-blue-600 hover:text-blue-500"
          >
            Voltar para lista de pacientes
          </button>
        </div>
      </div>
    )
  }

  const nextAppointment = getNextAppointment()
  const lastAppointment = getLastAppointment()
  const age = getPatientAge(patient.birthDate)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/patients')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Voltar
              </button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{patient.user.name}</h1>
                <p className="text-gray-600">CPF: {formatCPF(patient.cpf)} • {age} anos</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push(`/patients/${patient.id}/edit`)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Próxima Consulta */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Próxima Consulta</p>
                {nextAppointment ? (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(nextAppointment.dateTime, 'short')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {nextAppointment.physiotherapist.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-500">Não agendada</p>
                )}
              </div>
            </div>
          </div>

          {/* Última Consulta */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Última Consulta</p>
                {lastAppointment ? (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(lastAppointment.dateTime, 'short')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lastAppointment.physiotherapist.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-500">Nenhuma</p>
                )}
              </div>
            </div>
          </div>

          {/* Total de Consultas */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Consultas</p>
                <p className="text-lg font-semibold text-gray-900">
                  {patient.appointments?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                  patient.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}>
                  {patient.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{patient.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Telefone</p>
                          <p className="font-medium">{formatPhone(patient.phone)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Data de Nascimento</p>
                          <p className="font-medium">{formatDate(patient.birthDate)} ({age} anos)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {patient.rg && (
                        <div>
                          <p className="text-sm text-gray-500">RG</p>
                          <p className="font-medium">{patient.rg}</p>
                        </div>
                      )}
                      
                      {patient.emergencyContact && (
                        <div>
                          <p className="text-sm text-gray-500">Contato de Emergência</p>
                          <p className="font-medium">{patient.emergencyContact}</p>
                        </div>
                      )}
                      
                      {patient.profession && (
                        <div className="flex items-center space-x-3">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Profissão</p>
                            <p className="font-medium">{patient.profession}</p>
                            {patient.workplace && (
                              <p className="text-sm text-gray-500">{patient.workplace}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                {patient.address && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium">
                          {(patient.address as any)?.street}, {(patient.address as any)?.number}
                          {(patient.address as any)?.complement && `, ${(patient.address as any)?.complement}`}
                        </p>
                        <p className="text-gray-600">
                          {(patient.address as any)?.district}, {(patient.address as any)?.city} - {(patient.address as any)?.state}
                        </p>
                        <p className="text-gray-600">CEP: {(patient.address as any)?.zipCode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plano de Saúde */}
                {patient.healthInsurance && (patient.healthInsurance as any)?.name && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Plano de Saúde</h3>
                    <div className="flex items-start space-x-3">
                      <Heart className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium">{(patient.healthInsurance as any)?.name}</p>
                        <p className="text-gray-600">Carteira: {(patient.healthInsurance as any)?.cardNumber}</p>
                        <p className="text-gray-600">Tipo: {(patient.healthInsurance as any)?.type}</p>
                        {(patient.healthInsurance as any)?.expiryDate && (
                          <p className="text-gray-600">
                            Vencimento: {formatDate((patient.healthInsurance as any)?.expiryDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informações Médicas */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                {/* Medicações */}
                {patient.currentMedications && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Pill className="h-5 w-5 mr-2 text-blue-600" />
                      Medicações Atuais
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{patient.currentMedications}</p>
                    </div>
                  </div>
                )}

                {/* Alergias */}
                {patient.allergies && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                      Alergias
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{patient.allergies}</p>
                    </div>
                  </div>
                )}

                {/* Histórico Médico */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Histórico Médico
                  </h3>
                  {patient.medicalHistory && Object.keys(patient.medicalHistory).length > 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(patient.medicalHistory, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-500 italic">Nenhum histórico médico registrado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mapa Corporal */}
            {activeTab === 'body-map' && (
              <div>
                <BodyMap patientId={patient.id} showTimeline={true} />
              </div>
            )}

            {/* Consultas */}
            {activeTab === 'appointments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Consultas</h3>
                {patient.appointments && patient.appointments.length > 0 ? (
                  <div className="space-y-4">
                    {patient.appointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(appointment.dateTime, 'datetime')}
                            </p>
                            <p className="text-gray-600">
                              Dr. {appointment.physiotherapist.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Tipo: {appointment.type} • Status: {appointment.status}
                            </p>
                          </div>
                          {appointment.value && (
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(Number(appointment.value))}
                              </p>
                              <p className={cn(
                                "text-sm",
                                appointment.isPaid ? "text-green-600" : "text-red-600"
                              )}>
                                {appointment.isPaid ? 'Pago' : 'Pendente'}
                              </p>
                            </div>
                          )}
                        </div>
                        {appointment.observations && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-700">{appointment.observations}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma consulta registrada</p>
                  </div>
                )}
              </div>
            )}

            {/* Prescrições */}
            {activeTab === 'prescriptions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescrições de Exercícios</h3>
                {patient.prescriptions && patient.prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {patient.prescriptions.map((prescription) => (
                      <div key={prescription.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{prescription.title}</p>
                            <p className="text-gray-600">Dr. {prescription.physiotherapist.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(prescription.startDate)} - {prescription.frequency}
                            </p>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            prescription.status === 'ACTIVE' ? "bg-green-100 text-green-800" :
                            prescription.status === 'COMPLETED' ? "bg-blue-100 text-blue-800" :
                            prescription.status === 'PAUSED' ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {prescription.status}
                          </span>
                        </div>
                        
                        {prescription.description && (
                          <p className="text-gray-700 mb-3">{prescription.description}</p>
                        )}
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Exercícios:</h4>
                          {prescription.exercises.map((prescriptionExercise) => (
                            <div key={prescriptionExercise.id} className="ml-4 text-sm">
                              <p className="font-medium">{prescriptionExercise.exercise.name}</p>
                              <p className="text-gray-600">
                                {prescriptionExercise.sets} séries • {prescriptionExercise.reps} repetições
                                • {prescriptionExercise.rest}s descanso
                              </p>
                              {prescriptionExercise.specificNotes && (
                                <p className="text-gray-500 italic">{prescriptionExercise.specificNotes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma prescrição registrada</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientDetailPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_patients']}>
      <PatientDetailPageContent />
    </ProtectedRoute>
  )
}
