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
  Star,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  maxParticipants: number;
  pointsReward: number;
  imageUrl?: string;
  participantCount?: number;
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    maxParticipants: 50,
    pointsReward: 10,
    imageUrl: ''
  });

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
      
      const response = await fetch('/api/events', {
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
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
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
        pointsReward: 10,
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
      const response = await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: selectedEvent.title,
          description: selectedEvent.description,
          date: selectedEvent.date,
          endDate: selectedEvent.endDate,
          location: selectedEvent.location,
          maxParticipants: selectedEvent.maxParticipants,
          pointsReward: selectedEvent.pointsReward,
          imageUrl: selectedEvent.imageUrl
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
      const response = await fetch(`/api/admin/events/${eventId}`, {
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

  const viewParticipants = async (eventId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/events/${eventId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки участников');
      
      const data = await response.json();
      alert(`Участники события:\n${data.participants.map((p: any) => `${p.firstName} ${p.lastName} (${p.classGrade}${p.classLetter})`).join('\n')}`);
    } catch (error: any) {
      toast.error(error.message);
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
      <div style={{ padding: '20px', background: 'white', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h1 style={{ color: 'blue', fontSize: '24px', marginBottom: '10px' }}>
          ТЕСТ: EventManagement компонент загружается!
        </h1>
        <p>Loading: {loading ? 'ДА' : 'НЕТ'}</p>
        <p>Количество событий: {events.length}</p>
        {events.length > 0 && (
          <div>
            <h3>Первое событие:</h3>
            <p>{JSON.stringify(events[0], null, 2)}</p>
          </div>
        )}
      </div>
      
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
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(event.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{event.participantCount || 0} / {event.maxParticipants}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>{event.pointsReward} баллов</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => viewParticipants(event.id)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Участники
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
              <input
                type="number"
                placeholder="Баллы за участие"
                value={newEvent.pointsReward}
                onChange={(e) => setNewEvent({ ...newEvent, pointsReward: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="url"
                placeholder="Ссылка на изображение (опционально)"
                value={newEvent.imageUrl}
                onChange={(e) => setNewEvent({ ...newEvent, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                value={selectedEvent.date}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="datetime-local"
                value={selectedEvent.endDate || ''}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, endDate: e.target.value })}
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
                value={selectedEvent.maxParticipants}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, maxParticipants: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Баллы за участие"
                value={selectedEvent.pointsReward}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, pointsReward: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="url"
                placeholder="Ссылка на изображение (опционально)"
                value={selectedEvent.imageUrl || ''}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
    </div>
  );
};

export default EventManagement;