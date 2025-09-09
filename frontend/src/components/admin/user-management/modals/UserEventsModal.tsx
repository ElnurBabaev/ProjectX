import React from 'react';
import { X } from 'lucide-react';
import { User, UserEvent } from '../types';

interface UserEventsModalProps {
  isOpen: boolean;
  user: User | null;
  events: UserEvent[];
  loading: boolean;
  onClose: () => void;
}

const UserEventsModal: React.FC<UserEventsModalProps> = ({
  isOpen,
  user,
  events,
  loading,
  onClose
}) => {
  if (!isOpen || !user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Мероприятия пользователя {user.firstName} {user.lastName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Пользователь не участвовал ни в одном мероприятии</p>
        ) : (
          <div className="space-y-4">
            {events.map((event: UserEvent) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span><span className="emoji">📅</span> {new Date(event.start_date).toLocaleDateString('ru-RU')}</span>
                      <span><span className="emoji">📍</span> {event.location}</span>
                      <span><span className="emoji">🎯</span> {event.points} баллов</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      event.status === 'attended' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status === 'attended' ? 'Участвовал' : 'Зарегистрирован'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEventsModal;
