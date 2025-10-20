export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : 'https://agri-connect-ai-local-62lqxpyjs-allans-projects-5df5c5a9.vercel.app/api';

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
  getAll: async (opts?: { farmerId?: string; q?: string; status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.farmerId) params.append('farmerId', opts.farmerId);
    if (opts?.q) params.append('q', String(opts.q));
    if (opts?.status) params.append('status', opts.status);
    if (opts?.page) params.append('page', String(opts.page));
    if (opts?.limit) params.append('limit', String(opts.limit));

    const url = `${API_BASE_URL}/crops${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch crops');
    return response.json(); // { crops: Crop[], total: number }
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

// Public API
export const publicAPI = {
  getAdmins: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/admins`);
    if (!response.ok) throw new Error('Failed to fetch admins');
    return response.json();
  },
};

// Admin API
export const adminAPI = {
  getAllUsers: async () => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not authenticated');

    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createUser: async (userData: { email: string; password: string; fullName: string; userType: 'farmer' | 'buyer' | 'admin' }) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not authenticated');

    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  updateUser: async (id: string, userData: Partial<{ email: string; password: string; fullName: string; userType: 'farmer' | 'buyer' | 'admin' }>) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not authenticated');

    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (id: string) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not authenticated');

    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.id}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  },
};

// Messaging API
export const messagingAPI = {
  getMessages: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/messages?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  sendMessage: async (messageData: { senderId: string; receiverId: string; content: string }) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }
    return response.json();
  },

  markAsRead: async (messageId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to mark message as read');
    return response.json();
  },
};

// Orders API
export const orderAPI = {
  create: async (payload: { buyer_id: string; buyer_contact?: string; items: Array<{ crop_id: string; quantity: number }> }) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    return response.json();
  },

  list: async (opts?: { farmerId?: string }) => {
    const params = new URLSearchParams();
    if (opts?.farmerId) params.append('farmerId', opts.farmerId);
    const url = `${API_BASE_URL}/orders${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  approve: async (orderId: string) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not authenticated');
    const user = JSON.parse(userStr);
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve order');
    }
    return response.json();
  }
};

// AgroPlan API
export const agroplanAPI = {
  generate: async (payload: { user_id: string; soil_type?: string; location?: string; previous_crops?: string; notes?: string }) => {
    const response = await fetch(`${API_BASE_URL}/agroplan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to generate agroplan');
    }
    return response.json();
  }
};

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: 'farmer' | 'buyer' | 'admin' | 'super_admin';
  created_at: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  rating?: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: number;
  created_at: string;
  sender_name?: string;
  sender_type?: string;
  receiver_name?: string;
  receiver_type?: string;
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
