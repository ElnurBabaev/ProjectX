import React from 'react';
import { X } from 'lucide-react';
import { NewUser } from '../types';

interface CreateUserModalProps {
  isOpen: boolean;
  newUser: NewUser;
  onClose: () => void;
  onCreate: () => void;
  onUserChange: (user: NewUser) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  newUser,
  onClose,
  onCreate,
  onUserChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Создать пользователя</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Логин"
            value={newUser.login}
            onChange={(e) => onUserChange({ ...newUser, login: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={newUser.password}
            onChange={(e) => onUserChange({ ...newUser, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Имя"
            value={newUser.firstName}
            onChange={(e) => onUserChange({ ...newUser, firstName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Фамилия"
            value={newUser.lastName}
            onChange={(e) => onUserChange({ ...newUser, lastName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={newUser.classGrade}
              onChange={(e) => onUserChange({ ...newUser, classGrade: Number(e.target.value) })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 7 }, (_, i) => i + 5).map(grade => (
                <option key={grade} value={grade}>{grade} класс</option>
              ))}
            </select>
            <select
              value={newUser.classLetter}
              onChange={(e) => onUserChange({ ...newUser, classLetter: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {['А', 'Б', 'В', 'Г'].map(letter => (
                <option key={letter} value={letter}>{letter}</option>
              ))}
            </select>
          </div>
          <select
            value={newUser.role}
            onChange={(e) => onUserChange({ ...newUser, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="student">Ученик</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <div className="flex space-x-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={onCreate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
