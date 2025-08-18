import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  Trophy, 
  Eye, 
  EyeOff,
  Save,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { eventsApi, achievementsApi, authApi } from '../utils/api';
import { Event, Achievement } from '../utils/types';
import { useForm } from 'react-hook-form';
import AvatarSelector from '../components/AvatarSelector';
import { getAvatarPath } from '../config/simple-images';
import toast from 'react-hot-toast';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myAchievements, setMyAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsResponse, achievementsResponse] = await Promise.all([
        eventsApi.getMy(),
        achievementsApi.getMy()
      ]);
      
      setMyEvents(eventsResponse.data);
      setMyAchievements(achievementsResponse.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных профиля');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      toast.success('Пароль успешно изменен');
      setShowPasswordForm(false);
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка смены пароля');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    setAvatarLoading(true);
    try {
      await api.put('/auth/profile', { avatar_id: avatarId });
      
      // Обновляем локальное состояние пользователя
      if (user) {
        const updatedUser = { ...user, avatar_url: avatarId };
        
        // Обновляем контекст авторизации
        updateUser(updatedUser);
      }
      
      toast.success('Аватар обновлен');
    } catch (error) {
      toast.error('Ошибка обновления аватара');
      console.error('Avatar update error:', error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <img
                    src={getAvatarPath(user?.avatar_url)}
                    alt="Аватар"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback на инициалы если изображение не загружается
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentNode as HTMLElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-white text-3xl font-bold">${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}</span>`;
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowAvatarSelector(true)}
                  disabled={avatarLoading}
                  className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                  title="Изменить аватар"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              {/* User Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {user?.first_name} {user?.last_name}
                </h1>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6 text-gray-600">
                  <div className="flex items-center justify-center md:justify-start">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span>{user?.class}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <User className="w-4 h-4 mr-2" />
                    <span>{user?.login}</span>
                  </div>
                </div>
              </div>
              
              {/* Change Password Button */}
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn-secondary"
              >
                Сменить пароль
              </button>
            </div>
          </div>
        </motion.div>

        {/* Password Change Form */}
        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Смена пароля</h3>
              
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="label">Текущий пароль</label>
                  <div className="relative">
                    <input
                      {...register('currentPassword', { required: 'Текущий пароль обязателен' })}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`input pr-12 ${errors.currentPassword ? 'input-error' : ''}`}
                      placeholder="Введите текущий пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="label">Новый пароль</label>
                  <div className="relative">
                    <input
                      {...register('newPassword', { 
                        required: 'Новый пароль обязателен',
                        minLength: { value: 6, message: 'Пароль должен быть не менее 6 символов' }
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className={`input pr-12 ${errors.newPassword ? 'input-error' : ''}`}
                      placeholder="Введите новый пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label">Подтвердите новый пароль</label>
                  <input
                    {...register('confirmPassword', { required: 'Подтверждение пароля обязательно' })}
                    type="password"
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Повторите новый пароль"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary flex items-center"
                  >
                    {passwordLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {passwordLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <div className="text-center">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-700">
                {Math.floor(user?.points || 0)}
              </div>
              <div className="text-yellow-600 text-sm">Текущие баллы</div>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <div className="text-center">
              <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {Math.floor(user?.total_earned_points || 0)}
              </div>
              <div className="text-green-600 text-sm">Всего заработано</div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">
                {myEvents.length}
              </div>
              <div className="text-blue-600 text-sm">Мероприятий</div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <div className="text-center">
              <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">
                {myAchievements.length}
              </div>
              <div className="text-purple-600 text-sm">Достижений</div>
            </div>
          </div>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Мои мероприятия</h2>
          
          {myEvents.length > 0 ? (
            <div className="space-y-4">
              {myEvents.slice(0, 5).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white/80 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        event.registration_status === 'attended' ? 'bg-green-500' : 
                        event.registration_status === 'registered' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <p className="text-gray-600 text-sm">
                          {event.start_date && formatDate(event.start_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-gray-500 text-sm">
                        {event.registration_status === 'registered' ? 'Зарегистрирован' : 
                         event.registration_status === 'attended' ? 'Присутствовал' : 
                         event.registration_status === 'missed' ? 'Пропустил' : 'Отменен'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/80 backdrop-blur-lg rounded-xl">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Вы еще не участвовали в мероприятиях</p>
            </div>
          )}
        </motion.div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Мои достижения</h2>
          
          {myAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAchievements.slice(0, 6).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200"
                >
                  <div className="text-center">
                    <div className="mb-2 flex justify-center">
                      {achievement.icon && achievement.icon.startsWith('/images') ? (
                        <img 
                          src={achievement.icon}
                          alt={achievement.title}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            // Fallback к трофею если изображение не загружается
                            console.error('Failed to load achievement icon:', achievement.icon);
                            e.currentTarget.src = '/images/achievements/trophy-gold.svg';
                          }}
                        />
                      ) : (
                        <div className="text-2xl">
                          {achievement.icon || '🏆'}
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-yellow-800 mb-1">
                      {achievement.title}
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      {achievement.awarded_at && formatDate(achievement.awarded_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/80 backdrop-blur-lg rounded-xl">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">У вас пока нет достижений</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        currentAvatar={user?.avatar_url}
        onSelect={handleAvatarSelect}
        isLoading={avatarLoading}
      />
    </div>
  );
};

export default Profile;