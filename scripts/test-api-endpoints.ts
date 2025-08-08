// scripts/test-api-endpoints.ts - API endpoint testing script
// Run with: npx tsx scripts/test-api-endpoints.ts

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

class ApiTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<ApiResponse> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();

      return {
        success: response.ok,
        ...data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testPatientsApi() {
    console.log('🧪 Testing Patients API...\n');

    // Test 1: List patients
    console.log('1. Testing GET /api/patients');
    const patientsResponse = await this.makeRequest('/api/patients?limit=5');
    console.log('Response:', patientsResponse.success ? '✅ Success' : '❌ Failed');
    if (!patientsResponse.success) {
      console.log('Error:', patientsResponse.error);
    }
    console.log();

    // Test 2: Search patients
    console.log('2. Testing GET /api/patients/search');
    const searchResponse = await this.makeRequest('/api/patients/search?q=test&limit=3');
    console.log('Response:', searchResponse.success ? '✅ Success' : '❌ Failed');
    if (!searchResponse.success) {
      console.log('Error:', searchResponse.error);
    }
    console.log();

    // Test 3: Patient statistics
    console.log('3. Testing GET /api/patients/stats');
    const statsResponse = await this.makeRequest('/api/patients/stats');
    console.log('Response:', statsResponse.success ? '✅ Success' : '❌ Failed');
    if (!statsResponse.success) {
      console.log('Error:', statsResponse.error);
    }
    console.log();

    // Test 4: Create patient (this will likely fail without proper auth/db)
    console.log('4. Testing POST /api/patients');
    const createResponse = await this.makeRequest('/api/patients', 'POST', {
      name: 'Test Patient',
      cpf: '123.456.789-00',
      birthDate: '1990-01-01',
      phone: '(11) 99999-9999',
      email: 'test@example.com',
    });
    console.log('Response:', createResponse.success ? '✅ Success' : '❌ Failed');
    if (!createResponse.success) {
      console.log('Error:', createResponse.error);
    }
    console.log();
  }

  async testAppointmentsApi() {
    console.log('🗓️  Testing Appointments API...\n');

    // Test 1: List appointments
    console.log('1. Testing GET /api/appointments');
    const appointmentsResponse = await this.makeRequest('/api/appointments?limit=5');
    console.log('Response:', appointmentsResponse.success ? '✅ Success' : '❌ Failed');
    if (!appointmentsResponse.success) {
      console.log('Error:', appointmentsResponse.error);
    }
    console.log();

    // Test 2: Today's appointments
    console.log('2. Testing GET /api/appointments?section=today');
    const todayResponse = await this.makeRequest('/api/appointments?section=today');
    console.log('Response:', todayResponse.success ? '✅ Success' : '❌ Failed');
    if (!todayResponse.success) {
      console.log('Error:', todayResponse.error);
    }
    console.log();

    // Test 3: Appointment statistics
    console.log('3. Testing GET /api/appointments/stats');
    const statsResponse = await this.makeRequest('/api/appointments/stats');
    console.log('Response:', statsResponse.success ? '✅ Success' : '❌ Failed');
    if (!statsResponse.success) {
      console.log('Error:', statsResponse.error);
    }
    console.log();

    // Test 4: Create appointment (this will likely fail without proper auth/db)
    console.log('4. Testing POST /api/appointments');
    const createResponse = await this.makeRequest('/api/appointments', 'POST', {
      patientId: 'test-patient-id',
      therapistId: 'test-therapist-id',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      title: 'Test Appointment',
      type: 'Sessão',
      value: 100.00,
    });
    console.log('Response:', createResponse.success ? '✅ Success' : '❌ Failed');
    if (!createResponse.success) {
      console.log('Error:', createResponse.error);
    }
    console.log();
  }

  async testHealthCheck() {
    console.log('❤️  Testing Health Check...\n');
    
    const healthResponse = await this.makeRequest('/api/health');
    console.log('Response:', healthResponse.success ? '✅ Success' : '❌ Failed');
    if (!healthResponse.success) {
      console.log('Error:', healthResponse.error);
    }
    console.log();
  }

  async runAllTests() {
    console.log('🚀 Starting API Endpoint Tests\n');
    console.log('='.repeat(50));

    await this.testHealthCheck();
    await this.testPatientsApi();
    await this.testAppointmentsApi();

    console.log('='.repeat(50));
    console.log('✨ API Testing Complete!');
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new ApiTester();
  tester.runAllTests().catch(console.error);
}

export default ApiTester;
