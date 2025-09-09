export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  max_participants: number;
  image_url?: string;
  current_participants?: number;
  status?: string;
  points?: number;
}

export interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
  status: string;
  registered_at: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  max_participants: number;
  image_url?: string;
  points: number;
}

class EventService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = (import.meta as any).env?.VITE_API_URL || '/api';
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Произошла ошибка при выполнении запроса' 
      }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getEvents(): Promise<{ events: Event[] }> {
    const response = await fetch(`${this.apiBaseUrl}/events`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createEvent(eventData: CreateEventData): Promise<Event> {
    const response = await fetch(`${this.apiBaseUrl}/events`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData)
    });
    return this.handleResponse(response);
  }

  async updateEvent(eventId: number, eventData: Partial<Event>): Promise<Event> {
    const response = await fetch(`${this.apiBaseUrl}/events/${eventId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData)
    });
    return this.handleResponse(response);
  }

  async deleteEvent(eventId: number): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/events/${eventId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    await this.handleResponse(response);
  }

  async getParticipants(eventId: number): Promise<{ participants: Participant[] }> {
    const response = await fetch(`${this.apiBaseUrl}/admin/events/${eventId}/participants`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async confirmAttendance(eventId: number, userId: number): Promise<{ pointsAwarded: number }> {
    const response = await fetch(`${this.apiBaseUrl}/admin/events/${eventId}/confirm-attendance`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
    return this.handleResponse(response);
  }

  async cancelAttendance(eventId: number, userId: number): Promise<{ pointsDeducted: number }> {
    const response = await fetch(`${this.apiBaseUrl}/admin/events/${eventId}/cancel-attendance`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
    return this.handleResponse(response);
  }

  async exportParticipants(eventId: number): Promise<Blob> {
    const response = await fetch(`${this.apiBaseUrl}/admin/events/${eventId}/export-participants`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Ошибка экспорта' 
      }));
      throw new Error(errorData.message || 'Ошибка экспорта');
    }

    return response.blob();
  }
}

export const eventService = new EventService();
