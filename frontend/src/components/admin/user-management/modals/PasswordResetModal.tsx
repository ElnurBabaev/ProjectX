import React from 'react';
import { X } from 'lucide-react';
import { User } from '../types';

interface PasswordResetModalProps {
  isOpen: boolean;
  user: User | null;
  password: string;
  onClose: () => void;
  onReset: () => void;
  onPasswordChange: (password: string) => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  user,
  password,
  onClose,
  onReset,
  onPasswordChange
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Сменить пароль</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">
            Смена пароля для пользователя: <br />
            <strong>{user.firstName} {user.lastName}</strong>
          </p>
        </div>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Изменить пароль
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
