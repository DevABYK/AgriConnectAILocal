import { API_BASE_URL } from './api';

export const ordersAPI = {
  create: async (payload: { buyer_id: string; buyer_contact?: string; items: { crop_id: string; quantity: number }[] }) => {
    const response = await fetch(`${API_BASE_URL.replace('/api','')}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create orders');
    }
    return response.json();
  },

  list: async (farmerId?: string) => {
    const url = farmerId ? `${API_BASE_URL.replace('/api','')}/api/orders?farmerId=${farmerId}` : `${API_BASE_URL.replace('/api','')}/api/orders`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  }
};
