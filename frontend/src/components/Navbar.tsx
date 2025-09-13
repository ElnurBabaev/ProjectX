import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  Trophy, 
  ShoppingBag, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  BarChart3
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Мероприятия', href: '/events', icon: Calendar },
    { name: 'Достижения', href: '/achievements', icon: Trophy },
    { name: 'Рейтинг', href: '/rankings', icon: BarChart3 },
    { name: 'Магазин', href: '/shop', icon: ShoppingBag },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center focus:outline-none mr-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SA</span>
                </div>
                <span className="text-xl font-bold text-gray-800">SchoolActive</span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center px-3 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                <Shield className="w-4 h-4 mr-1" />
                Админ-панель
              </Link>
            )}

            <Link
              to="/profile"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <User className="w-4 h-4 mr-1" />
              Профиль
            </Link>

            <NotificationCenter className="md:block hidden" />

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5 stroke-current text-gray-600 hover:text-red-600" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <NotificationCenter className="md:hidden block" />

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isOpen ? (
                <X className="w-6 h-6 stroke-current text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 stroke-current text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="md:hidden overflow-hidden bg-white/90 backdrop-blur-lg border-t border-white/20"
      >
        <div className="px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}

          {/* Mobile Profile Section */}
          <div className="pt-4 border-t border-gray-200">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-3 text-base font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                <Shield className="w-5 h-5 mr-3" />
                Админ-панель
              </Link>
            )}

            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <User className="w-5 h-5 mr-3" />
              Профиль
            </Link>

            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-3 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Выйти
            </button>

            {user && (
              <div className="px-3 py-3 bg-gray-50 rounded-lg mt-2">
                <div className="text-sm text-gray-500">Вошли как:</div>
                <div className="font-medium text-gray-900">{user.login}</div>
                <div className="text-sm text-gray-500">
                  {user?.class}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
