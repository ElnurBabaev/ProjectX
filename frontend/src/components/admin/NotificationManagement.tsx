import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Bell, Check, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
  first_name: string;
  last_name: string;
  class_grade: number;
  class_letter: string;
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [systemNotification, setSystemNotification] = useState({
    title: '',
    message: '',
    userIds: [] as number[]
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications/admin/all');
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleSendSystemNotification = async () => {
    if (!systemNotification.title || !systemNotification.message || systemNotification.userIds.length === 0) {
      toast.error('Заполните все поля и выберите получателей');
      return;
    }

    try {
      await api.post('/notifications/admin/system', systemNotification);
      toast.success('Системное уведомление отправлено');
      setShowSystemModal(false);
      setSystemNotification({ title: '', message: '', userIds: [] });
      fetchNotifications();
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
      toast.error('Ошибка отправки уведомления');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order_created': return 'bg-blue-100 text-blue-800';
      case 'order_confirmed': return 'bg-green-100 text-green-800';
      case 'order_cancelled': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'order_created': return 'Новый заказ';
      case 'order_confirmed': return 'Заказ подтвержден';
      case 'order_cancelled': return 'Заказ отменен';
      case 'system': return 'Системное';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Уведомления</h2>
        <button
          onClick={() => setShowSystemModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send size={20} />
          Отправить системное уведомление
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Все уведомления</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>Нет уведомлений</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                        {getTypeText(notification.type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      Получатель: {notification.first_name} {notification.last_name} ({notification.class_grade}{notification.class_letter})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.is_read ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно для системного уведомления */}
      {showSystemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Отправить системное уведомление</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок
                </label>
                <input
                  type="text"
                  value={systemNotification.title}
                  onChange={(e) => setSystemNotification(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите заголовок"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сообщение
                </label>
                <textarea
                  value={systemNotification.message}
                  onChange={(e) => setSystemNotification(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите сообщение"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Получатели
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center px-3 py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={systemNotification.userIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSystemNotification(prev => ({
                              ...prev,
                              userIds: [...prev.userIds, user.id]
                            }));
                          } else {
                            setSystemNotification(prev => ({
                              ...prev,
                              userIds: prev.userIds.filter(id => id !== user.id)
                            }));
                          }
                        }}
                        className="mr-3"
                      />
                      <span className="text-sm">
                        {user.firstName} {user.lastName} ({user.classGrade}{user.classLetter})
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSystemNotification(prev => ({
                      ...prev,
                      userIds: users.map(u => u.id)
                    }))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Выбрать всех
                  </button>
                  <button
                    onClick={() => setSystemNotification(prev => ({ ...prev, userIds: [] }))}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Снять выделение
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSendSystemNotification}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Отправить
              </button>
              <button
                onClick={() => setShowSystemModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;