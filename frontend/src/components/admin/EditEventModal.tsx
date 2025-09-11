import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Event } from '../../services/eventService';
import ImageUploader from '../ImageUploader';

interface EditEventModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onSubmit: (event: Event) => Promise<boolean>;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        ...event,
        start_date: event.start_date?.replace(' ', 'T') || '',
        end_date: event.end_date?.replace(' ', 'T') || ''
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async () => {
    if (!formData) return;

    // Проверка обязательных полей
    if (!formData.title.trim() || !formData.description.trim() || 
        !formData.start_date || !formData.location.trim()) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    
    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Редактировать событие</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Название события"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
          
          <textarea
            placeholder="Описание события"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
          
          <input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
          
          <input
            type="datetime-local"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
          
          <input
            type="text"
            placeholder="Место проведения"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
          
          <input
            type="number"
            placeholder="Максимум участников"
            value={formData.max_participants}
            onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />
          
          <input
            type="number"
            placeholder="Количество баллов за участие"
            value={formData.points || 10}
            onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
            disabled={isSubmitting}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          />

          <select
            value={(formData.category as string) || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <option value="">Категория (опционально)</option>
            <option value="олимпиада">Олимпиада</option>
            <option value="спорт">Спорт</option>
            <option value="концерт">Концерт</option>
            <option value="акция">Акция</option>
          </select>
          
          <ImageUploader
            currentImage={formData.image_url || ''}
            onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
            label="Изображение мероприятия"
          />
        </div>
        
        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim() || 
                     !formData.start_date || !formData.location.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;
