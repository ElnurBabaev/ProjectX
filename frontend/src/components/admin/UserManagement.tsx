import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Key,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
  personalPoints: number;
  role: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    login: '',
    password: '',
    firstName: '',
    lastName: '',
    classGrade: 9,
    classLetter: 'А',
    role: 'student'
  });

  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки пользователей');
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка создания пользователя');
      }

      await fetchUsers();
      setShowCreateModal(false);
      setNewUser({
        login: '',
        password: '',
        firstName: '',
        lastName: '',
        classGrade: 9,
        classLetter: 'А',
        role: 'student'
      });
      toast.success('Пользователь создан успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: selectedUser.login,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          classGrade: selectedUser.classGrade,
          classLetter: selectedUser.classLetter,
          role: selectedUser.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления пользователя');
      }

      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('Пользователь обновлен успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сброса пароля');
      }

      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      toast.success('Пароль изменен успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка удаления пользователя');
      }

      await fetchUsers();
      toast.success('Пользователь удален успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateUserPoints = async (userId: number, points: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/update-points`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ points })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления баллов');
      }

      await fetchUsers();
      toast.success(`${points > 0 ? 'Баллы начислены' : 'Баллы списаны'}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.login.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesClass = filterClass === 'all' || `${user.classGrade}${user.classLetter}` === filterClass;
    
    return matchesSearch && matchesRole && matchesClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Управление пользователями</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать пользователя
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени или логину..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все роли</option>
            <option value="student">Ученики</option>
            <option value="admin">Администраторы</option>
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все классы</option>
            {Array.from({ length: 7 }, (_, i) => i + 5).map(grade => (
              ['А', 'Б', 'В', 'Г'].map(letter => (
                <option key={`${grade}${letter}`} value={`${grade}${letter}`}>
                  {grade}{letter} класс
                </option>
              ))
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Логин
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Класс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Баллы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.login}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.classGrade}{user.classLetter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{user.personalPoints}</span>
                      <button
                        onClick={() => {
                          const points = prompt('Введите количество баллов (отрицательное для списания):');
                          if (points && !isNaN(Number(points))) {
                            updateUserPoints(user.id, Number(points));
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        изменить
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Администратор' : 'Ученик'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Создать пользователя</h3>
              <button
                onClick={() => setShowCreateModal(false)}
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
                onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Имя"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Фамилия"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newUser.classGrade}
                  onChange={(e) => setNewUser({ ...newUser, classGrade: Number(e.target.value) })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 7 }, (_, i) => i + 5).map(grade => (
                    <option key={grade} value={grade}>{grade} класс</option>
                  ))}
                </select>
                <select
                  value={newUser.classLetter}
                  onChange={(e) => setNewUser({ ...newUser, classLetter: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {['А', 'Б', 'В', 'Г'].map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
              </div>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Ученик</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={createUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Редактировать пользователя</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Логин"
                value={selectedUser.login}
                onChange={(e) => setSelectedUser({ ...selectedUser, login: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Имя"
                value={selectedUser.firstName}
                onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Фамилия"
                value={selectedUser.lastName}
                onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={selectedUser.classGrade}
                  onChange={(e) => setSelectedUser({ ...selectedUser, classGrade: Number(e.target.value) })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 7 }, (_, i) => i + 5).map(grade => (
                    <option key={grade} value={grade}>{grade} класс</option>
                  ))}
                </select>
                <select
                  value={selectedUser.classLetter}
                  onChange={(e) => setSelectedUser({ ...selectedUser, classLetter: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {['А', 'Б', 'В', 'Г'].map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
              </div>
              <select
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Ученик</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={updateUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Сменить пароль</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                Смена пароля для пользователя: <br />
                <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={resetPassword}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Изменить пароль
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;