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
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Ш</span>
                </div>
                <span className="text-xl font-bold gradient-text hidden sm:block">
                  Школьные мероприятия
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="flex items-center px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                <Shield className="w-4 h-4 mr-2" />
                Админ
              </Link>
            )}
            
            <div className="flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.first_name?.charAt(0) || 'У'}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-800">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-gray-600">
                  {user?.class}
                </div>
              </div>
            </div>

            <Link
              to="/profile"
              className={`p-2 rounded-lg transition-all duration-200 ${
                isActive('/profile')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
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
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
          
          {user?.isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2 text-base font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
            >
              <Shield className="w-5 h-5 mr-3" />
              Админ панель
            </Link>
          )}

          <div className="border-t border-gray-200 my-2"></div>
          
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
              isActive('/profile')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5 mr-3" />
            Профиль
          </Link>
          
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Выйти
          </button>

          {/* User info in mobile */}
          <div className="px-3 py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.first_name?.charAt(0) || 'У'}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-sm text-gray-600">
                  {user?.class}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;