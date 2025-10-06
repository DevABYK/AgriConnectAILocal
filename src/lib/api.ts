const API_BASE_URL = 'http://localhost:3001/api';

// Auth API
export const authAPI = {
  register: async (email: string, password: string, fullName: string, userType: 'farmer' | 'buyer') => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, userType }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },
};

// Crop API
export const cropAPI = {
  getAll: async (farmerId?: string) => {
    const url = farmerId 
      ? `${API_BASE_URL}/crops?farmerId=${farmerId}`
      : `${API_BASE_URL}/crops`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch crops');
    return response.json();
  },

  create: async (cropData: {
    farmerId: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    harvestDate: string;
    location: string;
    image?: File;
  }) => {
    const formData = new FormData();
    Object.entries(cropData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/crops`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create crop');
    }
    return response.json();
  },

  update: async (id: string, cropData: {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    harvestDate: string;
    location: string;
    status?: string;
    image?: File;
  }) => {
    const formData = new FormData();
    Object.entries(cropData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/crops/${id}`, {
      method: 'PUT',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update crop');
    }
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/crops/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete crop');
    }
    return response.json();
  },
};

// User API
export const userAPI = {
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
};

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: 'farmer' | 'buyer';
  created_at: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  rating?: number;
}

export interface Crop {
  id: string;
  farmer_id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  harvest_date: string;
  location: string;
  image_url?: string;
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
  updated_at: string;
}
