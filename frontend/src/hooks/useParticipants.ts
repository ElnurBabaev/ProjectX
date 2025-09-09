import { useState } from 'react';
import { Participant, eventService } from '../services/eventService';
import toast from 'react-hot-toast';

export const useParticipants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchParticipants = async (eventId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        return;
      }

      const data = await eventService.getParticipants(eventId);
      setParticipants(data.participants || []);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast.error(error.message || 'Ошибка загрузки участников');
    } finally {
      setLoading(false);
    }
  };

  const confirmAttendance = async (eventId: number, userId: number) => {
    try {
      const result = await eventService.confirmAttendance(eventId, userId);
      await fetchParticipants(eventId);
      toast.success(`Участие подтверждено${result.pointsAwarded > 0 ? `. Начислено ${result.pointsAwarded} баллов` : ''}`);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка подтверждения участия');
      return false;
    }
  };

  const cancelAttendance = async (eventId: number, userId: number) => {
    try {
      const result = await eventService.cancelAttendance(eventId, userId);
      await fetchParticipants(eventId);
      toast.success(`Подтверждение отменено${result.pointsDeducted > 0 ? `. Списано ${result.pointsDeducted} баллов` : ''}`);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отмены подтверждения');
      return false;
    }
  };

  const exportParticipants = async (eventId: number, eventTitle: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        return false;
      }

      const blob = await eventService.exportParticipants(eventId);
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Участники_${eventTitle.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Список участников успешно экспортирован');
      return true;
    } catch (error: any) {
      console.error('Error exporting participants:', error);
      toast.error(error.message || 'Ошибка экспорта участников');
      return false;
    }
  };

  return {
    participants,
    loading,
    fetchParticipants,
    confirmAttendance,
    cancelAttendance,
    exportParticipants
  };
};
