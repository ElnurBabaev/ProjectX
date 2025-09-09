import React from 'react';
import { Users, Plus } from 'lucide-react';
import { useUserManagement } from './hooks/useUserManagement';
import UserFiltersComponent from './UserFilters';
import UserTable from './UserTable';
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';
import PasswordResetModal from './modals/PasswordResetModal';
import UserEventsModal from './modals/UserEventsModal';

const UserManagement: React.FC = () => {
  const {
    // State
    users,
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
  } = useUserManagement();

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
          onClick={() => openModal('showCreateModal')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать пользователя
        </button>
      </div>

      {/* Filters */}
      <UserFiltersComponent filters={filters} onFiltersChange={updateFilters} />

      {/* Users Table */}
      <UserTable
        users={users}
        onEdit={(user) => openModal('showEditModal', user)}
        onDelete={deleteUser}
        onResetPassword={(user) => openModal('showPasswordModal', user)}
        onCheckAchievements={checkUserAchievements}
        onViewEvents={(user) => {
          setSelectedUser(user);
          fetchUserEvents(user.id);
        }}
        onUpdatePoints={updateUserPoints}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={modals.showCreateModal}
        newUser={newUser}
        onClose={() => closeModal('showCreateModal')}
        onCreate={createUser}
        onUserChange={setNewUser}
      />

      <EditUserModal
        isOpen={modals.showEditModal}
        user={selectedUser}
        onClose={() => closeModal('showEditModal')}
        onUpdate={updateUser}
        onUserChange={updateSelectedUser}
      />

      <PasswordResetModal
        isOpen={modals.showPasswordModal}
        user={selectedUser}
        password={newPassword}
        onClose={() => closeModal('showPasswordModal')}
        onReset={resetPassword}
        onPasswordChange={setNewPassword}
      />

      <UserEventsModal
        isOpen={modals.showUserEventsModal}
        user={selectedUser}
        events={userEvents}
        loading={loadingEvents}
        onClose={() => closeModal('showUserEventsModal')}
      />
    </div>
  );
};

export default UserManagement;
