# API Endpoints Documentation

This document describes the essential API endpoints for patients and appointments in the FSIIOFlow application.

## Patients API

### Base URL: `/api/patients`

#### 1. List Patients
- **Endpoint**: `GET /api/patients`
- **Description**: Retrieve a paginated list of patients with optional filtering
- **Query Parameters**:
  - `limit` (optional): Number of patients to return (default: 20, max: 100)
  - `cursor` (optional): Cursor for pagination
  - `search` (optional): Search term for name, CPF, or email
  - `status` (optional): Filter by patient status (Active, Inactive, Discharged)

**Example Request**:
```bash
GET /api/patients?limit=10&search=João&status=Active
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "patient_123",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "(11) 99999-9999",
      "status": "Active",
      "lastVisit": "2024-01-15",
      "avatarUrl": "https://example.com/avatar.jpg",
      "medicalAlerts": "Alergia a dipirona"
    }
  ],
  "pagination": {
    "nextCursor": "patient_124",
    "hasMore": true,
    "totalCount": 25
  },
  "meta": {
    "cacheHit": false,
    "queryDuration": 45
  }
}
```

#### 2. Create Patient
- **Endpoint**: `POST /api/patients`
- **Description**: Create a new patient record

**Required Fields**: `name`, `cpf`, `birthDate`, `phone`

**Example Request**:
```bash
POST /api/patients
Content-Type: application/json

{
  "name": "Maria Santos",
  "cpf": "123.456.789-00",
  "birthDate": "1990-05-15",
  "phone": "(11) 98888-8888",
  "email": "maria@example.com",
  "address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01234-567"
  },
  "emergencyContact": {
    "name": "José Santos",
    "phone": "(11) 97777-7777"
  }
}
```

#### 3. Get Patient by ID
- **Endpoint**: `GET /api/patients/[id]`
- **Description**: Retrieve a specific patient by ID

**Example Request**:
```bash
GET /api/patients/patient_123
```

#### 4. Update Patient
- **Endpoint**: `PUT /api/patients/[id]`
- **Description**: Update an existing patient record

**Example Request**:
```bash
PUT /api/patients/patient_123
Content-Type: application/json

{
  "phone": "(11) 99999-0000",
  "status": "Inactive"
}
```

#### 5. Discharge Patient (Soft Delete)
- **Endpoint**: `DELETE /api/patients/[id]`
- **Description**: Soft delete a patient by setting status to 'Discharged'

**Example Request**:
```bash
DELETE /api/patients/patient_123
```

#### 6. Search Patients
- **Endpoint**: `GET /api/patients/search`
- **Description**: Full-text search across patient records
- **Query Parameters**:
  - `q` (required): Search query (minimum 2 characters)
  - `limit` (optional): Number of results (default: 10, max: 50)

**Example Request**:
```bash
GET /api/patients/search?q=João Silva&limit=5
```

#### 7. Patient Statistics
- **Endpoint**: `GET /api/patients/stats`
- **Description**: Get aggregated patient statistics for dashboard

**Example Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "inactive": 25,
    "discharged": 5,
    "newThisMonth": 8
  },
  "meta": {
    "cacheHit": true,
    "queryDuration": 12
  }
}
```

## Appointments API

### Base URL: `/api/appointments`

#### 1. List Appointments
- **Endpoint**: `GET /api/appointments`
- **Description**: Retrieve a paginated list of appointments with optional filtering
- **Query Parameters**:
  - `limit` (optional): Number of appointments to return (default: 20, max: 100)
  - `cursor` (optional): Cursor for pagination
  - `startDate` (optional): Filter by start date (YYYY-MM-DD)
  - `endDate` (optional): Filter by end date (YYYY-MM-DD)
  - `patientId` (optional): Filter by patient ID
  - `therapistId` (optional): Filter by therapist ID
  - `status` (optional): Filter by appointment status
  - `section` (optional): Special sections like 'today'

**Example Request**:
```bash
GET /api/appointments?section=today
GET /api/appointments?patientId=patient_123&limit=10
```

#### 2. Create Appointment
- **Endpoint**: `POST /api/appointments`
- **Description**: Create a new appointment

**Required Fields**: `patientId`, `therapistId`, `startTime`, `endTime`, `title`, `type`

**Example Request**:
```bash
POST /api/appointments
Content-Type: application/json

{
  "patientId": "patient_123",
  "therapistId": "therapist_456",
  "startTime": "2024-01-20T14:00:00Z",
  "endTime": "2024-01-20T15:00:00Z",
  "title": "Sessão de Fisioterapia",
  "type": "Sessão",
  "value": 100.00,
  "observations": "Primeira sessão pós-cirurgia"
}
```

#### 3. Get Appointment by ID
- **Endpoint**: `GET /api/appointments/[id]`
- **Description**: Retrieve a specific appointment with patient and therapist details

#### 4. Update Appointment
- **Endpoint**: `PUT /api/appointments/[id]`
- **Description**: Update an existing appointment

**Example Request**:
```bash
PUT /api/appointments/appt_789
Content-Type: application/json

{
  "startTime": "2024-01-20T15:00:00Z",
  "endTime": "2024-01-20T16:00:00Z",
  "status": "Realizado"
}
```

#### 5. Delete Appointment
- **Endpoint**: `DELETE /api/appointments/[id]`
- **Description**: Delete an appointment

#### 6. Appointment Statistics
- **Endpoint**: `GET /api/appointments/stats`
- **Description**: Get aggregated appointment statistics for dashboard

**Example Response**:
```json
{
  "success": true,
  "data": {
    "totalToday": 12,
    "completedToday": 8,
    "scheduledToday": 4,
    "totalThisMonth": 320,
    "completedThisMonth": 280,
    "revenueThisMonth": 28000.00,
    "revenueLastMonth": 25500.00
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (in development)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Authentication & Authorization

All endpoints require authentication via the Next.js middleware system. The middleware will be automatically applied to all `/api/*` routes.

## Performance Features

- **Caching**: Responses are cached using Redis for improved performance
- **Pagination**: Cursor-based pagination for efficient large dataset handling
- **Query Optimization**: Database queries are optimized with proper indexing
- **Response Compression**: Large responses are automatically compressed

## Rate Limiting

API endpoints are protected by rate limiting to prevent abuse:
- 100 requests per minute per IP for read operations
- 30 requests per minute per IP for write operations
