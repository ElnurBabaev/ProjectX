import { useState, useEffect } from 'react';
import { Event, eventService } from '../services/eventService';
import toast from 'react-hot-toast';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        setLoading(false);
        return;
      }
      
      const data = await eventService.getEvents();
      setEvents(data.events || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error(error.message || 'Ошибка загрузки событий');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    endDate: string;
    location: string;
    maxParticipants: number;
  imageUrl: string;
    points: number;
  category?: string;
  }) => {
    try {
      await eventService.createEvent({
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.date,
        end_date: eventData.endDate || undefined,
        location: eventData.location,
        max_participants: eventData.maxParticipants,
    image_url: eventData.imageUrl || undefined,
    category: eventData.category || undefined,
        points: eventData.points
      });

      await fetchEvents();
      toast.success('Событие создано успешно');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания события');
      return false;
    }
  };

  const updateEvent = async (event: Event) => {
    try {
      await eventService.updateEvent(event.id, {
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date || undefined,
        location: event.location,
        max_participants: event.max_participants,
  image_url: event.image_url || undefined,
  category: (event as any).category || undefined,
        points: event.points || 10,
        status: event.status || 'upcoming'
      });

      await fetchEvents();
      toast.success('Событие обновлено успешно');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления события');
      return false;
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return false;
    }

    try {
      await eventService.deleteEvent(eventId);
      await fetchEvents();
      toast.success('Событие удалено успешно');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления события');
      return false;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetchEvents: fetchEvents
  };
};
