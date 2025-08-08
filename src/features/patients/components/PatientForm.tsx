'use client'

import React, { useState, useEffect } from 'react'
import { Save, X, Upload, Calendar, MapPin, Heart, Briefcase } from 'lucide-react'
import { CreatePatientInput, UpdatePatientInput, PatientWithDetails } from '@/types/prisma'
import { validateAndSanitize, createPatientSchema, updatePatientSchema } from '@/lib/validations'
import { formatCPF, formatPhone, formatCEP } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PatientFormProps {
  patient?: PatientWithDetails
  onSave: (data: CreatePatientInput | UpdatePatientInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function PatientForm({ patient, onSave, onCancel, isLoading }: PatientFormProps) {
  const [formData, setFormData] = useState({
    // Dados do usuário
    name: '',
    email: '',
    phone: '',
    
    // Documentos
    cpf: '',
    rg: '',
    birthDate: '',
    
    // Contatos
    emergencyContact: '',
    
    // Endereço
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: ''
    },
    
    // Plano de saúde
    healthInsurance: {
      name: '',
      cardNumber: '',
      expiryDate: '',
      type: 'PARTICULAR' as 'PARTICULAR' | 'CONVENIO' | 'SUS'
    },
    
    // Informações médicas
    currentMedications: '',
    allergies: '',
    
    // Informações profissionais
    profession: '',
    workplace: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'health' | 'medical' | 'professional'>('basic')

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.user.name,
        email: patient.email,
        phone: patient.phone,
        cpf: patient.cpf,
        rg: patient.rg || '',
        birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '',
        emergencyContact: patient.emergencyContact || '',
        address: {
          street: (patient.address as any)?.street || '',
          number: (patient.address as any)?.number || '',
          complement: (patient.address as any)?.complement || '',
          district: (patient.address as any)?.district || '',
          city: (patient.address as any)?.city || '',
          state: (patient.address as any)?.state || '',
          zipCode: (patient.address as any)?.zipCode || ''
        },
        healthInsurance: {
          name: (patient.healthInsurance as any)?.name || '',
          cardNumber: (patient.healthInsurance as any)?.cardNumber || '',
          expiryDate: (patient.healthInsurance as any)?.expiryDate || '',
          type: (patient.healthInsurance as any)?.type || 'PARTICULAR'
        },
        currentMedications: patient.currentMedications || '',
        allergies: patient.allergies || '',
        profession: patient.profession || '',
        workplace: patient.workplace || ''
      })
    }
  }, [patient])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Formatação automática
    let formattedValue = value
    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'phone') {
      formattedValue = formatPhone(value)
    } else if (name === 'zipCode') {
      formattedValue = formatCEP(value)
    }

    // Atualizar campos aninhados
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: formattedValue
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: formattedValue }))
    }

    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validações básicas
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    }

    // Validação de idade (maior de idade)
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 18) {
        newErrors.birthDate = 'Paciente deve ser maior de idade'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        ...formData,
        birthDate: new Date(formData.birthDate),
        address: formData.address,
        healthInsurance: formData.healthInsurance.name ? formData.healthInsurance : undefined
      }

      if (patient) {
        // Atualizar paciente existente
        await onSave(submitData as UpdatePatientInput)
      } else {
        // Criar novo paciente
        const createData: CreatePatientInput = {
          user: {
            name: formData.name,
            email: formData.email,
            password: 'temp123', // Senha temporária
            role: 'PACIENTE',
            phone: formData.phone
          },
          ...submitData
        }
        await onSave(createData)
      }
    } catch (error) {
      console.error('Erro ao salvar paciente:', error)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Dados Básicos', icon: Calendar },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'health', label: 'Plano de Saúde', icon: Heart },
    { id: 'medical', label: 'Informações Médicas', icon: Heart },
    { id: 'professional', label: 'Profissional', icon: Briefcase }
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {patient ? 'Editar Paciente' : 'Novo Paciente'}
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-1 inline" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-1 inline" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2",
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
      <div className="bg-white rounded-lg border p-6">
        {/* Dados Básicos */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                    errors.name ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                    errors.email ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                    errors.cpf ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RG
                </label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                    errors.birthDate ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
                    errors.phone ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contato de Emergência
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder="Nome e telefone do contato de emergência"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Endereço */}
        {activeTab === 'address' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  name="address.number"
                  value={formData.address.number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  name="address.complement"
                  value={formData.address.complement}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  name="address.district"
                  value={formData.address.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  {/* Adicionar outros estados */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Plano de Saúde */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  name="healthInsurance.name"
                  value={formData.healthInsurance.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Carteira
                </label>
                <input
                  type="text"
                  name="healthInsurance.cardNumber"
                  value={formData.healthInsurance.cardNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Plano
                </label>
                <select
                  name="healthInsurance.type"
                  value={formData.healthInsurance.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PARTICULAR">Particular</option>
                  <option value="CONVENIO">Convênio</option>
                  <option value="SUS">SUS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  name="healthInsurance.expiryDate"
                  value={formData.healthInsurance.expiryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Informações Médicas */}
        {activeTab === 'medical' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicações Atuais
              </label>
              <textarea
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                rows={3}
                placeholder="Liste as medicações que o paciente está tomando atualmente"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alergias
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                rows={3}
                placeholder="Descreva alergias conhecidas (medicamentos, alimentos, substâncias)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Informações Profissionais */}
        {activeTab === 'professional' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profissão
                </label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local de Trabalho
                </label>
                <input
                  type="text"
                  name="workplace"
                  value={formData.workplace}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
