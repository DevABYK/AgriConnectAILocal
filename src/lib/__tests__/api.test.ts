import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authAPI, cropAPI, API_BASE_URL } from '../api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('authAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'farmer',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await authAPI.register('test@example.com', 'password', 'Test User', 'farmer')

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
          fullName: 'Test User',
          userType: 'farmer'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on registration failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already exists' })
      })

      await expect(authAPI.register('test@example.com', 'password', 'Test User', 'farmer'))
        .rejects.toThrow('Email already exists')
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'farmer',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await authAPI.login('test@example.com', 'password')

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      })

      await expect(authAPI.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })
  })
})

describe('cropAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch crops with query parameters', async () => {
      const mockResponse = {
        crops: [
          {
            id: 'crop-1',
            farmer_id: 'farmer-1',
            name: 'Tomatoes',
            description: 'Fresh tomatoes',
            quantity: 100,
            unit: 'kg',
            price_per_unit: 5,
            harvest_date: '2024-06-01',
            location: 'Farm A',
            status: 'available',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await cropAPI.getAll({
        farmerId: 'farmer-1',
        q: 'tomato',
        status: 'available',
        page: 1,
        limit: 10
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/crops?farmerId=farmer-1&q=tomato&status=available&page=1&limit=10`
      )
      expect(result).toEqual(mockResponse)
    })

    it('should fetch all crops without parameters', async () => {
      const mockResponse = { crops: [], total: 0 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await cropAPI.getAll()

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/crops`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('create', () => {
    it('should create crop successfully', async () => {
      const mockResponse = {
        id: 'crop-123',
        farmer_id: 'farmer-1',
        name: 'New Crop',
        description: 'Description',
        quantity: 50,
        unit: 'kg',
        price_per_unit: 10,
        harvest_date: '2024-07-01',
        location: 'Farm B',
        status: 'available',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const cropData = {
        farmerId: 'farmer-1',
        name: 'New Crop',
        description: 'Description',
        quantity: 50,
        unit: 'kg',
        pricePerUnit: 10,
        harvestDate: '2024-07-01',
        location: 'Farm B'
      }

      const result = await cropAPI.create(cropData)

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/crops`, {
        method: 'POST',
        body: expect.any(FormData)
      })
      expect(result).toEqual(mockResponse)
    })
  })
})