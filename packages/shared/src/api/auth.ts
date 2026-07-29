import { apiClient, USE_MOCK } from './client'
import type { User } from '../types/user'
import { mockUsers, delay, saveMockUsersToStorage } from './mock-data'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

class AuthApi {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // If using mock data
    if (USE_MOCK) {
      await delay(400)
      
      let user = mockUsers.find(u => u.email === credentials.email)
      
      if (!user) {
        // Create mock user if doesn't exist
        user = {
          id: String(Date.now()),
          email: credentials.email,
          full_name: credentials.email.split('@')[0],
          role: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        mockUsers.push(user)
        saveMockUsersToStorage()
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUserEmail', user.email)
        localStorage.setItem('access_token', 'mock-access-token')
        localStorage.setItem('refresh_token', 'mock-refresh-token')
      }
      
      return {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: user,
      }
    }

    // Real API call
    const response = await apiClient.post('/auth/login/', credentials)
    const result = response.data.data
    const authData: AuthResponse = {
      access: result.access_token,
      refresh: result.refresh_token || '',
      user: result.user ? { ...result.user, role: result.user.role?.toLowerCase() } : result.user,
    }
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', authData.access)
      localStorage.setItem('currentUserEmail', authData.user.email)
    }
    
    return authData
  }

  async register(data: RegisterData): Promise<User> {
    // If using mock data
    if (USE_MOCK) {
      await delay(400)
      
      const existingUser = mockUsers.find(u => u.email === data.email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }
      
      const newUser: User = {
        id: String(Date.now()),
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      mockUsers.push(newUser)
      saveMockUsersToStorage()
      return newUser
    }

    // Real API call
    const response = await apiClient.post('/auth/register/', data)
    return response.data.data
  }

  async logout(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('currentUserEmail')
    }
  }

  async getCurrentUser(): Promise<User> {
    // If using mock data
    if (USE_MOCK) {
      await delay(100)
      if (typeof window !== 'undefined') {
        const email = localStorage.getItem('currentUserEmail')
        if (email) {
          const user = mockUsers.find(u => u.email === email)
          if (user) {
            return user
          }
        }
      }
      throw new Error('No user is currently logged in')
    }

    // Real API call
    const response = await apiClient.get('/auth/me')
    const user = response.data.data
    return user ? { ...user, role: user.role?.toLowerCase() } : user
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    // If using mock data
    if (USE_MOCK) {
      await delay(300)
      if (typeof window !== 'undefined') {
        const email = localStorage.getItem('currentUserEmail')
        if (email) {
          const index = mockUsers.findIndex(u => u.email === email)
          if (index !== -1) {
            mockUsers[index] = { ...mockUsers[index], ...data }
            saveMockUsersToStorage()
            return mockUsers[index]
          }
        }
      }
      throw new Error('User not found')
    }

    // Real API call
    const response = await apiClient.patch('/auth/profile/', data)
    const user = response.data.data
    return user ? { ...user, role: user.role?.toLowerCase() } : user
  }
}

export const authApi = new AuthApi()