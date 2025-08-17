import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../utils/types';
import { authApi } from '../utils/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('🔐 Проверка аутентификации:', { hasToken: !!token, hasSavedUser: !!savedUser });
      
      if (token && savedUser) {
        try {
          // Сначала восстанавливаем пользователя из localStorage
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('👤 Пользователь восстановлен из localStorage:', userData.username);
          
          // Затем проверяем токен на сервере и обновляем данные
          const response = await authApi.getMe();
          const updatedUser = response.data.user;
          
          console.log('🔄 Сравнение данных пользователя:', {
            localStorage: userData,
            server: updatedUser,
            avatarLocal: userData.avatar_url,
            avatarServer: updatedUser.avatar_url
          });
          
          // Если сервер не вернул avatar_url, но он есть в localStorage - сохраняем его
          if (userData.avatar_url && !updatedUser.avatar_url) {
            console.log('🔄 Сохраняем avatar_url из localStorage');
            updatedUser.avatar_url = userData.avatar_url;
          }
          
          // Если сервер вернул avatar_url, но он отличается от localStorage - используем серверный
          if (updatedUser.avatar_url && updatedUser.avatar_url !== userData.avatar_url) {
            console.log('🔄 Обновляем avatar_url с сервера');
          }
          
          // Всегда обновляем пользователя (даже если данные одинаковые, чтобы убедиться что avatar_url правильный)
          console.log('⚠️ Обновляем данные пользователя');
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('🔄 Финальные данные пользователя:', updatedUser);
        } catch (error) {
          console.error('❌ Ошибка проверки токена:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (token && !savedUser) {
        // Если есть токен, но нет данных пользователя
        try {
          const response = await authApi.getMe();
          const userData = response.data.user;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('👤 Данные пользователя получены с сервера:', userData.username);
        } catch (error) {
          console.error('❌ Ошибка получения данных пользователя:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('🚫 Токен не найден, пользователь не авторизован');
      }
      setLoading(false);
    };

    checkAuth();
    
    // Слушатель событий storage для синхронизации между вкладками
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('📡 Изменение в localStorage обнаружено:', e.key);
        if (!e.newValue) {
          // Токен или пользователь удален в другой вкладке
          setUser(null);
        } else if (e.key === 'user' && e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setUser(userData);
          } catch (error) {
            console.error('❌ Ошибка парсинга данных пользователя:', error);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (loginValue: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authApi.login({ login: loginValue, password });
      const { token, user: userData } = response.data;
      
      console.log('📦 Данные от сервера при логине:', {
        token: !!token,
        user: userData,
        avatar_url: userData.avatar_url
      });
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('💾 Данные сохранены в localStorage:', {
        savedUser: JSON.parse(localStorage.getItem('user') || '{}'),
        avatar_url: JSON.parse(localStorage.getItem('user') || '{}').avatar_url
      });
      
      console.log('✅ Успешный вход:', userData.login);
      toast.success('Вы успешно вошли в систему!');
      return true;
    } catch (error: any) {
      console.error('❌ Ошибка входа:', error);
      toast.error(error.response?.data?.message || 'Ошибка входа');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      setLoading(true);
      
      console.log('📝 Данные для регистрации:', data);
      
      const response = await authApi.register(data);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Регистрация прошла успешно!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка регистрации');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('🚪 Пользователь вышел из системы');
    toast.success('Вы вышли из системы');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    try {
      const response = await authApi.getMe();
      const updatedUser = response.data.user;
      
      // Сохраняем avatar_url, если он есть в текущих данных, но отсутствует на сервере
      if (user.avatar_url && !updatedUser.avatar_url) {
        updatedUser.avatar_url = user.avatar_url;
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('🔄 Данные пользователя обновлены:', updatedUser);
    } catch (error) {
      console.error('❌ Ошибка обновления данных пользователя:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};