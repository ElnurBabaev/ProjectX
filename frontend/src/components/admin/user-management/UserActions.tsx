import React from 'react';
import { Edit, Trash2, Key, Trophy, Users } from 'lucide-react';
import { User } from './types';

interface UserActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onResetPassword: (user: User) => void;
  onCheckAchievements: (userId: number) => void;
  onViewEvents: (user: User) => void;
  onUpdatePoints: (userId: number, points: number) => void;
}

const UserActions: React.FC<UserActionsProps> = ({
  user,
  onEdit,
  onDelete,
  onResetPassword,
  onCheckAchievements,
  onViewEvents,
  onUpdatePoints
}) => {
  const handlePointsUpdate = () => {
    const points = prompt('Введите количество баллов (отрицательное для списания):');
    if (points && !isNaN(Number(points))) {
      onUpdatePoints(user.id, Number(points));
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <div className="flex items-center space-x-2 mr-4">
        <span className="text-sm text-gray-900">{Math.floor(user.personalPoints || 0)}</span>
        <button
          onClick={handlePointsUpdate}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          изменить
        </button>
      </div>
      <button
        onClick={() => onEdit(user)}
        className="text-blue-600 hover:text-blue-900"
        title="Редактировать"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => onCheckAchievements(user.id)}
        className="text-green-600 hover:text-green-900"
        title="Проверить достижения"
      >
        <Trophy className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewEvents(user)}
        className="text-purple-600 hover:text-purple-900"
        title="Посмотреть мероприятия"
      >
        <Users className="w-4 h-4" />
      </button>
      <button
        onClick={() => onResetPassword(user)}
        className="text-yellow-600 hover:text-yellow-900"
        title="Сбросить пароль"
      >
        <Key className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(user.id)}
        className="text-red-600 hover:text-red-900"
        title="Удалить"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UserActions;
