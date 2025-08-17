import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Users,
  Clock,
  MapPin,
  X,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../ImageUploader';

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
  status: string;
  registered_at: string;
}

interface Event {
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

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    maxParticipants: 50,
    imageUrl: ''
  });

  // Функция для получения полного URL изображения
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // уже полный URL
    if (url.startsWith('/uploads/')) {
      const fullUrl = `http://localhost:5000${url}`;
      console.log('🔧 Преобразование URL:', url, '→', fullUrl);
      return fullUrl;
    }
    return url; // внешняя ссылка или что-то еще
  };

  useEffect(() => {
    console.log('EventManagement: Component mounted, loading events...');
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    console.log('EventManagement: fetchEvents called');
    try {
      const token = localStorage.getItem('token');
      console.log('EventManagement: token exists:', !!token);
      
      if (!token) {
        console.log('EventManagement: No token, stopping fetch');
        toast.error('Необходима авторизация');
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('EventManagement: response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка загрузки событий' }));
        throw new Error(errorData.message || 'Ошибка загрузки событий');
      }
      
      const data = await response.json();
      console.log('EventManagement: received data:', data);
      setEvents(data.events || []);
    } catch (error) {
      console.error('EventManagement: Error in fetchEvents:', error);
      toast.error('Ошибка загрузки событий');
    } finally {
      console.log('EventManagement: Setting loading to false');
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          start_date: newEvent.date,
          end_date: newEvent.endDate || null,
          location: newEvent.location,
          max_participants: newEvent.maxParticipants,
          image_url: newEvent.imageUrl || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка создания события');
      }

      await fetchEvents();
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        endDate: '',
        location: '',
        maxParticipants: 50,
        imageUrl: ''
      });
      toast.success('Событие создано успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateEvent = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: selectedEvent.title,
          description: selectedEvent.description,
          start_date: selectedEvent.start_date,
          end_date: selectedEvent.end_date || null,
          location: selectedEvent.location,
          max_participants: selectedEvent.max_participants,
          image_url: selectedEvent.image_url || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления события');
      }

      await fetchEvents();
      setShowEditModal(false);
      setSelectedEvent(null);
      toast.success('Событие обновлено успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка удаления события');
      }

      await fetchEvents();
      toast.success('Событие удалено успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchParticipants = async (eventId: number) => {
    setParticipantsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка загрузки участников' }));
        throw new Error(errorData.message || 'Ошибка загрузки участников');
      }
      
      const data = await response.json();
      setParticipants(data.participants || []);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast.error(error.message || 'Ошибка загрузки участников');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const confirmAttendance = async (eventId: number, userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/confirm-attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка подтверждения участия');
      }

      const result = await response.json();
      await fetchParticipants(eventId);
      toast.success(`Участие подтверждено${result.pointsAwarded > 0 ? `. Начислено ${result.pointsAwarded} баллов` : ''}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const cancelAttendance = async (eventId: number, userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/cancel-attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка отмены подтверждения');
      }

      const result = await response.json();
      await fetchParticipants(eventId);
      toast.success(`Подтверждение отменено${result.pointsDeducted > 0 ? `. Списано ${result.pointsDeducted} баллов` : ''}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openParticipantsModal = async (event: Event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
    await fetchParticipants(event.id);
  };

  const exportParticipants = async (eventId: number, eventTitle: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необходима авторизация');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/export-participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка экспорта' }));
        throw new Error(errorData.message || 'Ошибка экспорта');
      }

      // Получаем файл как blob
      const blob = await response.blob();
      
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
    } catch (error: any) {
      console.error('Error exporting participants:', error);
      toast.error(error.message || 'Ошибка экспорта участников');
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    console.log('EventManagement: Showing loading spinner');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Загружаю события...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">Управление событиями</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать событие
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск событий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {event.image_url && (
              <img
                src={`${getFullImageUrl(event.image_url)}?t=${Date.now()}`}
                alt={event.title}
                className="w-full h-48 object-cover"
                crossOrigin="anonymous"
                onLoad={() => {
                  console.log('✅ Изображение загружено:', event.image_url, '-> Полный URL:', getFullImageUrl(event.image_url || ''));
                }}
                onError={(e) => {
                  console.error('❌ Ошибка загрузки изображения:', event.image_url, '-> Полный URL:', getFullImageUrl(event.image_url || ''));
                  console.error('❌ Детали ошибки:', e);
                  // Попробуем загрузить через fetch для диагностики
                  fetch(getFullImageUrl(event.image_url || ''))
                    .then(response => {
                      console.log('📡 Fetch результат:', response.status, response.statusText);
                      console.log('📡 Fetch заголовки:', [...response.headers.entries()]);
                    })
                    .catch(fetchError => {
                      console.error('📡 Fetch ошибка:', fetchError);
                    });
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(event.start_date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{event.current_participants || 0} / {event.max_participants}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openParticipantsModal(event)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Участники
                </button>
                <button
                  onClick={() => exportParticipants(event.id, event.title)}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  title="Экспортировать участников в Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет событий</h3>
          <p className="text-gray-500">Создайте первое событие для начала работы</p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Создать событие</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название события"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Описание события"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="datetime-local"
                placeholder="Дата окончания (опционально)"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Место проведения"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Максимум участников"
                value={newEvent.maxParticipants}
                onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <ImageUploader
                currentImage={newEvent.imageUrl}
                onImageChange={(imageUrl) => setNewEvent({ ...newEvent, imageUrl })}
                label="Изображение мероприятия"
              />
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={createEvent}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Редактировать событие</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название события"
                value={selectedEvent.title}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Описание события"
                value={selectedEvent.description}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="datetime-local"
                value={selectedEvent.start_date}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="datetime-local"
                value={selectedEvent.end_date || ''}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Место проведения"
                value={selectedEvent.location}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Максимум участников"
                value={selectedEvent.max_participants}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, max_participants: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <ImageUploader
                currentImage={selectedEvent.image_url || ''}
                onImageChange={(imageUrl) => setSelectedEvent({ ...selectedEvent, image_url: imageUrl })}
                label="Изображение мероприятия"
              />
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={updateEvent}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Участники события: {selectedEvent.title}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportParticipants(selectedEvent.id, selectedEvent.title)}
                  className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  title="Экспортировать список участников в Excel"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Экспорт
                </button>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {participantsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Загружаю участников...</p>
              </div>
            ) : participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map(participant => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">
                        {participant.firstName} {participant.lastName}
                      </span>
                      <span className="ml-2 text-gray-500">
                        ({participant.classGrade}{participant.classLetter})
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        participant.status === 'attended' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {participant.status === 'attended' ? 'Присутствовал' : 'Зарегистрирован'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {participant.status === 'registered' ? (
                        <button
                          onClick={() => confirmAttendance(selectedEvent.id, participant.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Подтвердить участие
                        </button>
                      ) : (
                        <button
                          onClick={() => cancelAttendance(selectedEvent.id, participant.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Отменить подтверждение
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">На это событие пока никто не зарегистрирован</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;