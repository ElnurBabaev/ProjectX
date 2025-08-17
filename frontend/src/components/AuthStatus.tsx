import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthStatus: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200"
      >
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="text-gray-600">Проверка авторизации...</span>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-green-50/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-green-200"
    >
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-green-500" />
        <span className="text-green-700 font-medium">{user.firstName}</span>
        <CheckCircle className="w-4 h-4 text-green-500" />
      </div>
    </motion.div>
  );
};

export default AuthStatus;