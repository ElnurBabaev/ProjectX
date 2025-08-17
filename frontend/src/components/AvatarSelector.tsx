import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';
import { AVATAR_OPTIONS, getAvatarPath } from '../config/simple-images';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  onSelect: (avatarId: string) => void;
  isLoading?: boolean;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSelect,
  isLoading = false
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'avatar-default');

  const handleSelect = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Выбрать аватар</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {AVATAR_OPTIONS.map((avatar) => (
            <div
              key={avatar.id}
              className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                selectedAvatar === avatar.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedAvatar(avatar.id)}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={avatar.path}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback на default avatar если изображение не загружается
                    e.currentTarget.src = '/images/avatars/default.png';
                  }}
                />
              </div>
              <p className="text-xs text-center mt-2 text-gray-600 truncate">
                {avatar.name}
              </p>
              {selectedAvatar === avatar.id && (
                <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Текущий:</span>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
              <img
                src={getAvatarPath(currentAvatar)}
                alt="Текущий аватар"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/avatars/default.png';
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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

export default AvatarSelector;