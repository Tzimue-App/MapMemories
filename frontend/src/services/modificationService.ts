import { authService } from './authService';

export type ModificationType = 'PIN' | 'RADIUS' | 'BOUNDARY';

export interface Modification {
  id?: number;
  type: ModificationType;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  color?: string;
  geojson?: string;
  osmId?: number;
  createdAt?: string;
}

export const modificationService = {
  async getModifications(): Promise<Modification[]> {
    const token = authService.getToken();
    if (!token) return [];

    const res = await fetch('/api/modifications', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch user modifications');
    }

    return await res.json();
  },

  async saveModification(modification: Omit<Modification, 'id' | 'createdAt'>): Promise<Modification> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('User is not authenticated');
    }

    const res = await fetch('/api/modifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(modification),
    });

    if (!res.ok) {
      throw new Error('Failed to save modification');
    }

    return await res.json();
  },

  async deleteModification(id: number): Promise<void> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('User is not authenticated');
    }

    const res = await fetch(`/api/modifications/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to delete modification');
    }
  },
};
