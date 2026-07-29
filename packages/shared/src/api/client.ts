import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '../types/api'

declare const process: any;

let apiBaseUrl = 'http://localhost:8000/api';

const getNextPublicApiUrl = (): string | undefined => {
  try {
    return process.env.NEXT_PUBLIC_API_URL;
  } catch {
    return undefined;
  }
};

const getExpoPublicApiUrl = (): string | undefined => {
  try {
    return process.env.EXPO_PUBLIC_API_URL;
  } catch {
    return undefined;
  }
};

apiBaseUrl = getNextPublicApiUrl() || getExpoPublicApiUrl() || 'http://localhost:8000/api';

export const USE_MOCK = (() => {
  try {
    // @ts-ignore
    const nextMock = process.env.NEXT_PUBLIC_USE_MOCK;
    if (nextMock === 'true') return true;
  } catch {}
  try {
    // @ts-ignore
    const expoMock = process.env.EXPO_PUBLIC_USE_MOCK;
    if (expoMock === 'true') return true;
  } catch {}
  return false; // Default to false (real API)
})();

export class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: apiBaseUrl,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleError.bind(this)
    )

    this.client.interceptors.response.use(
      (response) => response,
      this.handleResponseError.bind(this)
    )
  }

  private handleRequest(config: InternalAxiosRequestConfig) {
    const token = this.getToken()
    if (token && config.headers) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`)
      } else {
        config.headers.Authorization = `Bearer ${token}`
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  }

  private handleError(error: any) {
    return Promise.reject(error)
  }

  private async handleResponseError(error: any) {
    const originalRequest = error.config

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await this.client.post('/auth/refresh/')
        const result = response.data.data
        this.setToken(result.access_token)
        
        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${result.access_token}`)
          } else {
            originalRequest.headers.Authorization = `Bearer ${result.access_token}`
            originalRequest.headers['Authorization'] = `Bearer ${result.access_token}`
          }
        }
        
        return this.client(originalRequest)
      } catch (refreshError) {
        this.clearTokens()
        return Promise.reject(refreshError)
      }
    }

    const serverError = error.response?.data?.error
    const apiError: ApiError = {
      message: serverError?.message || error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
      errors: serverError?.errors || error.response?.data?.errors,
    }

    return Promise.reject(apiError)
  }

  private getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  private getRefreshToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('refresh_token')
    }
    return null
  }

  private setToken(token: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  private clearTokens() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  getClient(): AxiosInstance {
    return this.client
  }
}

export const apiClient = new ApiClient().getClient()