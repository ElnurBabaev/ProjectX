import React from 'react';
import { X, Download, Users } from 'lucide-react';
import { Event, Participant } from '../../services/eventService';

interface ParticipantsModalProps {
  isOpen: boolean;
  event: Event | null;
  participants: Participant[];
  loading: boolean;
  onClose: () => void;
  onConfirmAttendance: (eventId: number, userId: number) => Promise<boolean>;
  onCancelAttendance: (eventId: number, userId: number) => Promise<boolean>;
  onExportParticipants: (eventId: number, eventTitle: string) => Promise<boolean>;
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  event,
  participants,
  loading,
  onClose,
  onConfirmAttendance,
  onCancelAttendance,
  onExportParticipants
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            Участники события: {event.title}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportParticipants(event.id, event.title)}
              className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              title="Экспортировать список участников в Excel"
            >
              <Download className="w-4 h-4 mr-1" />
              Экспорт
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {loading ? (
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
                      onClick={() => onConfirmAttendance(event.id, participant.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Подтвердить участие
                    </button>
                  ) : (
                    <button
                      onClick={() => onCancelAttendance(event.id, participant.id)}
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
  );
};

export default ParticipantsModal;
