import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Plus } from 'lucide-react';
import { eventsApi } from '../utils/api';
import { Event } from '../utils/types';
import toast from 'react-hot-toast';

const Events: React.FC = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
  const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Функция для получения полного URL изображения
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // уже полный URL
    if (url.startsWith('/uploads/')) {
      const fullUrl = `${API_ORIGIN}${url}`;
      console.log('🔧 Преобразование URL в Events:', url, '→', fullUrl);
      return fullUrl;
    }
    return url; // внешняя ссылка или что-то еще
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки мероприятий');
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (eventId: number) => {
    try {
      await eventsApi.register(eventId);
      toast.success('Вы успешно зарегистрировались на мероприятие!');
      loadEvents(); // Обновляем список
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка регистрации');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const eventTypes = [
    { value: 'all', label: 'Все мероприятия', color: 'bg-gray-100 text-gray-700' },
    { value: 'олимпиада', label: 'Олимпиады', color: 'bg-blue-100 text-blue-700' },
    { value: 'спорт', label: 'Спорт', color: 'bg-green-100 text-green-700' },
    { value: 'концерт', label: 'Концерты', color: 'bg-purple-100 text-purple-700' },
    { value: 'акция', label: 'Акции', color: 'bg-orange-100 text-orange-700' },
  ];

  // Убираем фильтрацию по type, так как этого свойства нет в типе Event
  const filteredEvents = events; // Показываем все события

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка мероприятий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">
            📅 Школьные мероприятия
          </h1>
          <p className="text-gray-600 text-lg">
            Участвуй в мероприятиях и зарабатывай баллы за активность!
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {eventTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === type.value
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm hover:shadow-md'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card hover:shadow-2xl"
            >
              {/* Event Title */}
              <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                {event.title}
              </h3>

              {/* Event Image */}
              {event.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={`${getFullImageUrl(event.image_url)}?t=${Date.now()}`}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                    crossOrigin="anonymous"
                    onLoad={() => {
                      console.log('✅ Изображение события загружено:', event.image_url, '-> Полный URL:', getFullImageUrl(event.image_url || ''));
                    }}
                    onError={(e) => {
                      console.error('❌ Ошибка загрузки изображения события:', event.image_url, '-> Полный URL:', getFullImageUrl(event.image_url || ''));
                      console.error('❌ Детали ошибки:', e);
                      // Попробуем загрузить через fetch для диагностики
                      fetch(getFullImageUrl(event.image_url || ''))
                        .then(response => {
                          console.log('📡 Fetch результат для события:', response.status, response.statusText);
                          console.log('📡 Fetch заголовки для события:', [...response.headers.entries()]);
                        })
                        .catch(fetchError => {
                          console.error('📡 Fetch ошибка для события:', fetchError);
                        });
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Event Description */}
              <p className="text-gray-600 mb-4 line-clamp-3">
                {event.description}
              </p>

              {/* Event Details */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatDate(event.start_date)}
                  </span>
                </div>
                
                {event.end_date && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      до {formatDate(event.end_date)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {event.current_participants || 0} / {event.max_participants || 0} участников
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(
                        ((event.current_participants || 0) / (event.max_participants || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Register Button */}
              <button
                onClick={() => registerForEvent(event.id)}
                disabled={(event.current_participants || 0) >= (event.max_participants || 0)}
                className={`w-full btn ${
                  (event.current_participants || 0) >= (event.max_participants || 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                } flex items-center justify-center`}
              >
                <Plus className="w-4 h-4 mr-2" />
                {(event.current_participants || 0) >= (event.max_participants || 0)
                  ? 'Мест нет'
                  : 'Зарегистрироваться'
                }
              </button>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Мероприятий не найдено
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'В данный момент нет доступных мероприятий'
                : 'Мероприятий выбранного типа пока нет'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Events;