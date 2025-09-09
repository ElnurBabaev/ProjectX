import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { adminApi } from '../../../../utils/api';
import { User, NewUser, UserEvent, UserFilters, ModalState } from '../types';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    filterRole: 'all',
    filterClass: 'all'
  });

  const [modals, setModals] = useState<ModalState>({
    showCreateModal: false,
    showEditModal: false,
    showPasswordModal: false,
    showUserEventsModal: false
  });

  const [newUser, setNewUser] = useState<NewUser>({
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
      console.log('Fetching users...');
      const response = await adminApi.getUsers();
      console.log('Users fetched:', response.data.users);
      setUsers(response.data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Ошибка загрузки пользователей');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      await adminApi.createUser({
        login: newUser.login,
        password: newUser.password,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        class_grade: newUser.classGrade,
        class_letter: newUser.classLetter,
        role: newUser.role
      });
      await fetchUsers();
      setModals(prev => ({ ...prev, showCreateModal: false }));
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
      toast.error(error.response?.data?.message || 'Ошибка создания пользователя');
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      console.log('Updating user:', selectedUser);
      await adminApi.updateUser(selectedUser.id, {
        login: selectedUser.login,
        first_name: selectedUser.firstName,
        last_name: selectedUser.lastName,
        class_grade: selectedUser.classGrade,
        class_letter: selectedUser.classLetter,
        role: selectedUser.role
      });
      console.log('User updated successfully, fetching users...');
      await fetchUsers();
      setModals(prev => ({ ...prev, showEditModal: false }));
      setSelectedUser(null);
      toast.success('Пользователь обновлен успешно');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Ошибка обновления пользователя');
    }
  };

  const resetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      await adminApi.resetPassword(selectedUser.id, newPassword);
      setModals(prev => ({ ...prev, showPasswordModal: false }));
      setSelectedUser(null);
      setNewPassword('');
      toast.success('Пароль изменен успешно');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка сброса пароля');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      await adminApi.deleteUser(userId);
      await fetchUsers();
      toast.success('Пользователь удален успешно');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка удаления пользователя');
    }
  };

  const updateUserPoints = async (userId: number, points: number) => {
    try {
      await adminApi.updateUserPoints(userId, points);
      await fetchUsers();
      toast.success(`${points > 0 ? 'Баллы начислены' : 'Баллы списаны'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении баллов');
    }
  };

  const checkUserAchievements = async (userId: number) => {
    try {
      const { data } = await api.post(`/admin/users/${userId}/check-achievements`);
      
      if (data.achievementsEarned > 0) {
        toast.success(`${data.message}\nНовые достижения: ${data.newAchievements.map((a: any) => a.title).join(', ')}`);
      } else {
        toast.success('Проверка завершена. Новых достижений не найдено.');
      }
      
      await fetchUsers();
    } catch (error: any) {
      toast.error('Ошибка проверки достижений');
    }
  };

  const fetchUserEvents = async (userId: number) => {
    setLoadingEvents(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}/events`);
      setUserEvents(data.events || []);
      setModals(prev => ({ ...prev, showUserEventsModal: true }));
    } catch (error: any) {
      toast.error('Ошибка загрузки мероприятий пользователя');
    } finally {
      setLoadingEvents(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.firstName?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
                         (user.lastName?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
                         (user.login?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase());
    const matchesRole = filters.filterRole === 'all' || user.role === filters.filterRole;
    const matchesClass = filters.filterClass === 'all' || `${user.classGrade || ''}${user.classLetter || ''}` === filters.filterClass;
    
    return matchesSearch && matchesRole && matchesClass;
  });

  const openModal = (modalName: keyof ModalState, user?: User) => {
    if (user) setSelectedUser(user);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    if (modalName !== 'showCreateModal') {
      setSelectedUser(null);
    }
    if (modalName === 'showPasswordModal') {
      setNewPassword('');
    }
  };

  const updateFilters = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const updateSelectedUser = (user: User) => {
    setSelectedUser(user);
  };

  return {
    // State
    users: filteredUsers,
    loading,
    userEvents,
    loadingEvents,
    selectedUser,
    filters,
    modals,
    newUser,
    newPassword,
    
    // Setters
    setSelectedUser,
    setNewUser,
    setNewPassword,
    updateSelectedUser,
    
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
    updateUserPoints,
    checkUserAchievements,
    fetchUserEvents,
    openModal,
    closeModal,
    updateFilters
  };
};
