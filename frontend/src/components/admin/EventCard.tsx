import React from 'react';
import { Clock, MapPin, Users, Trophy, Edit, Trash2, Download } from 'lucide-react';
import { Event } from '../../services/eventService';
import { getFullImageUrl } from '../../utils/imageUtils';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
  onViewParticipants: (event: Event) => void;
  onExportParticipants: (eventId: number, eventTitle: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onViewParticipants,
  onExportParticipants
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
          {event.points && (
            <div className="flex items-center space-x-2 text-green-600">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">+{event.points} баллов</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onViewParticipants(event)}
            className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Участники
          </button>
          <button
            onClick={() => onExportParticipants(event.id, event.title)}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            title="Экспортировать участников в Excel"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(event)}
            className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
