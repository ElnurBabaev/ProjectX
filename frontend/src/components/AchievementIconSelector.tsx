import React, { useState } from 'react';
import { X, Check, Award } from 'lucide-react';
import { ACHIEVEMENT_ICON_OPTIONS, getAchievementIconPath } from '../config/simple-images';

interface AchievementIconSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon?: string | null;
  onSelect: (iconId: string) => void;
  isLoading?: boolean;
}

const AchievementIconSelector: React.FC<AchievementIconSelectorProps> = ({
  isOpen,
  onClose,
  currentIcon,
  onSelect,
  isLoading = false
}) => {
  const [selectedIcon, setSelectedIcon] = useState(currentIcon || '/images/achievements/trophy-gold.svg');

  const handleSelect = () => {
    onSelect(selectedIcon);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold">Выбрать иконку достижения</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6 max-h-96 overflow-y-auto">
          {ACHIEVEMENT_ICON_OPTIONS.map((icon) => (
            <div
              key={icon.id}
              className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                selectedIcon === icon.path
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedIcon(icon.path)}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img
                  src={icon.path}
                  alt={icon.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    // Fallback на default icon если изображение не загружается
                    e.currentTarget.src = '/images/achievements/trophy-gold.png';
                  }}
                />
              </div>
              <p className="text-xs text-center mt-2 text-gray-600 truncate">
                {icon.name}
              </p>
              {selectedIcon === icon.path && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Текущая:</span>
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <img
                src={getAchievementIconPath(currentIcon)}
                alt="Текущая иконка"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/images/achievements/trophy-gold.png';
                }}
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              onClick={handleSelect}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Выбрать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementIconSelector;