// services/api-gateway.ts - Unified API gateway for centralized request handling
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Request/Response interfaces
export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: T;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestId?: string;
  cacheHit?: boolean;
  duration?: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  requestId?: string;
}

// API Gateway configuration
interface ApiGatewayConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ApiGatewayConfig = {
  baseURL: process.env.API_BASE_URL || '/api',
  timeout: parseInt(process.env.API_TIMEOUT || '10000'),
  retries: parseInt(process.env.API_RETRY_ATTEMPTS || '3'),
  retryDelay: 1000,
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
};

// Request metrics storage
interface RequestMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  cacheHit?: boolean;
  retryCount?: number;
  error?: string;
}

class ApiGateway {
  private client: AxiosInstance;
  private config: ApiGatewayConfig;
  private metrics: Map<string, RequestMetrics> = new Map();
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: any) => any> = [];

  constructor(config?: Partial<ApiGatewayConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  // Create configured Axios instance
  private createAxiosInstance(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return client;
  }

  // Setup request/response interceptors
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        const requestId = this.generateRequestId();
        config.headers = (config.headers as any) || ({} as any);
        (config.headers as any)['X-Request-ID'] = requestId;
        (config.headers as any)['X-Client-Version'] = '1.0.0';
        (config.headers as any)['X-Timestamp'] = Date.now().toString();

        // Apply custom request interceptors
        this.requestInterceptors.forEach(interceptor => {
          config = interceptor(config);
        });

        // Start metrics tracking
        if (this.config.enableMetrics) {
          this.startMetricsTracking(requestId, config);
        }

        // Log request in development
        if (this.config.enableLogging) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: any) => {
        const requestId = response.config.headers?.['X-Request-ID'] as string;

        // Complete metrics tracking
        if (this.config.enableMetrics && requestId) {
          this.completeMetricsTracking(requestId, response.status);
        }

        // Apply custom response interceptors
        this.responseInterceptors.forEach(interceptor => {
          response = interceptor(response);
        });

        // Log response in development
        if (this.config.enableLogging) {
          const duration = this.getRequestDuration(requestId);
          console.log(`✅ API Response: ${response.status} ${response.config.url} (${duration}ms)`);
        }

        return response;
      },
      async (error: AxiosError) => {
        const requestId = (error.config as any)?.headers?.['X-Request-ID'] as string;

        // Complete metrics tracking for errors
        if (this.config.enableMetrics && requestId) {
          this.completeMetricsTracking(requestId, error.response?.status || 0, error.message);
        }

        // Retry logic
        const shouldRetry = this.shouldRetry(error);
        if (shouldRetry) {
          return this.retryRequest(error);
        }

        // Log error
        if (this.config.enableLogging) {
          console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.message);
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start metrics tracking
  private startMetricsTracking(requestId: string, config: AxiosRequestConfig): void {
    const metrics: RequestMetrics = {
      requestId,
      method: config.method?.toUpperCase() || 'GET',
      url: config.url || '',
      startTime: Date.now(),
      retryCount: 0,
    };

    this.metrics.set(requestId, metrics);
  }

  // Complete metrics tracking
  private completeMetricsTracking(requestId: string, status: number, error?: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.status = status;
      metrics.error = error;

      this.metrics.set(requestId, metrics);
    }
  }

  // Get request duration
  private getRequestDuration(requestId: string): number {
    const metrics = this.metrics.get(requestId);
    return metrics?.duration || 0;
  }

  // Check if request should be retried
  private shouldRetry(error: AxiosError): boolean {
    const config = error.config as any;
    const retryCount = config._retryCount || 0;

    // Don't retry if max retries reached
    if (retryCount >= this.config.retries) {
      return false;
    }

    // Don't retry client errors (4xx)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Retry on network errors, timeouts, and server errors (5xx)
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      !error.response ||
      (error.response.status >= 500)
    );
  }

  // Retry request with exponential backoff
  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config as any;
    const retryCount = (config._retryCount || 0) + 1;
    const delay = this.config.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff

    config._retryCount = retryCount;

    // Update metrics
    const requestId = config.headers?.['X-Request-ID'];
    if (requestId) {
      const metrics = this.metrics.get(requestId);
      if (metrics) {
        metrics.retryCount = retryCount;
        this.metrics.set(requestId, metrics);
      }
    }

    console.log(`🔄 Retrying request (${retryCount}/${this.config.retries}) after ${delay}ms: ${config.url}`);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.client.request(config);
  }

  // Transform Axios error to ApiError
  private transformError(error: AxiosError): ApiError {
    const requestId = (error.config as any)?.headers?.['X-Request-ID'] as string;

    return {
      message: error.message || 'An unknown error occurred',
      status: error.response?.status || 0,
      code: error.code,
      details: error.response?.data,
      requestId,
    };
  }

  // Public API methods
  async get<T = any>(url: string, config?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  async delete<T = any>(url: string, config?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  // Generic request method
  async request<T = any>(apiRequest: ApiRequest<T>): Promise<ApiResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      method: apiRequest.method.toLowerCase() as any,
      url: apiRequest.url,
      data: apiRequest.data,
      params: apiRequest.params,
      headers: apiRequest.headers,
      timeout: apiRequest.timeout || this.config.timeout,
    };

    try {
      const response = await this.client.request<T>(axiosConfig);
      const requestId = (response.config.headers as any)?.['X-Request-ID'] as string;
      const duration = this.getRequestDuration(requestId);

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        requestId,
        duration,
      };
    } catch (error) {
      throw error;
    }
  }

  // Add custom request interceptor
  addRequestInterceptor(interceptor: (config: AxiosRequestConfig) => AxiosRequestConfig): void {
    this.requestInterceptors.push(interceptor as any);
  }

  // Add custom response interceptor
  addResponseInterceptor(interceptor: (response: AxiosResponse) => AxiosResponse): void {
    this.responseInterceptors.push(interceptor as any);
  }

  // Get performance metrics
  getMetrics(): RequestMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Get performance statistics
  getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    retryRate: number;
  } {
    const metrics = this.getMetrics();
    const completedRequests = metrics.filter(m => m.endTime);

    if (completedRequests.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        retryRate: 0,
      };
    }

    const totalRequests = completedRequests.length;
    const averageResponseTime = completedRequests.reduce((sum, m) => sum + (m.duration || 0), 0) / totalRequests;
    const successfulRequests = completedRequests.filter(m => m.status && m.status >= 200 && m.status < 400).length;
    const errorRequests = completedRequests.filter(m => m.error || (m.status && m.status >= 400)).length;
    const retriedRequests = completedRequests.filter(m => (m.retryCount || 0) > 0).length;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round((successfulRequests / totalRequests) * 100),
      errorRate: Math.round((errorRequests / totalRequests) * 100),
      retryRate: Math.round((retriedRequests / totalRequests) * 100),
    };
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Create singleton instance
export const apiGateway = new ApiGateway();

// Export class
export { ApiGateway };
