import React, { useState } from 'react';
import { Calendar, Search, Plus } from 'lucide-react';
import { Event as EventType } from '../../services/eventService';
import { useEvents } from '../../hooks/useEvents';
import { useParticipants } from '../../hooks/useParticipants';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';
import ParticipantsModal from './ParticipantsModal';

const EventManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  // Используем наши кастомные хуки
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { 
    participants, 
    loading: participantsLoading, 
    fetchParticipants, 
    confirmAttendance, 
    cancelAttendance, 
    exportParticipants 
  } = useParticipants();

  // Фильтрация событий
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработчики модалей
  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    endDate: string;
    location: string;
    maxParticipants: number;
    imageUrl: string;
    points: number;
  }) => {
    const success = await createEvent(eventData);
    if (success) {
      setShowCreateModal(false);
    }
    return success;
  };

  const handleEditEvent = (event: EventType) => {
    setSelectedEvent({
      ...event,
      start_date: event.start_date?.replace(' ', 'T') || '',
      end_date: event.end_date?.replace(' ', 'T') || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (event: EventType) => {
    const success = await updateEvent(event);
    if (success) {
      setShowEditModal(false);
      setSelectedEvent(null);
    }
    return success;
  };

  const handleDeleteEvent = async (eventId: number) => {
    await deleteEvent(eventId);
  };

  const handleViewParticipants = async (event: EventType) => {
    setSelectedEvent({
      ...event,
      start_date: event.start_date?.replace(' ', 'T') || '',
      end_date: event.end_date?.replace(' ', 'T') || ''
    });
    setShowParticipantsModal(true);
    await fetchParticipants(event.id);
  };

  const handleConfirmAttendance = async (eventId: number, userId: number) => {
    const success = await confirmAttendance(eventId, userId);
    return success;
  };

  const handleCancelAttendance = async (eventId: number, userId: number) => {
    const success = await cancelAttendance(eventId, userId);
    return success;
  };

  const handleExportParticipants = async (eventId: number, eventTitle: string) => {
    const success = await exportParticipants(eventId, eventTitle);
    return success;
  };

  if (loading) {
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
          <EventCard
            key={event.id}
            event={event}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onViewParticipants={handleViewParticipants}
            onExportParticipants={handleExportParticipants}
          />
        ))}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет событий</h3>
          <p className="text-gray-500">Создайте первое событие для начала работы</p>
        </div>
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
      />

      <EditEventModal
        isOpen={showEditModal}
        event={selectedEvent}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleUpdateEvent}
      />

      <ParticipantsModal
        isOpen={showParticipantsModal}
        event={selectedEvent}
        participants={participants}
        loading={participantsLoading}
        onClose={() => {
          setShowParticipantsModal(false);
          setSelectedEvent(null);
        }}
        onConfirmAttendance={handleConfirmAttendance}
        onCancelAttendance={handleCancelAttendance}
        onExportParticipants={handleExportParticipants}
      />
    </div>
  );
};

export default EventManagement;
