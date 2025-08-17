import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface LoginFormData {
  login: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.login, data.password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 50, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold gradient-text mb-2"
            >
              Добро пожаловать!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600"
            >
              Войдите в свой аккаунт школьника
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Login field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="login" className="label">
                <User className="w-4 h-4 inline mr-2" />
                Логин
              </label>
              <input
                {...register('login', { 
                  required: 'Логин обязателен',
                  minLength: { value: 3, message: 'Минимум 3 символа' }
                })}
                type="text"
                id="login"
                className={`input ${errors.login ? 'input-error' : ''}`}
                placeholder="Введите ваш логин"
              />
              {errors.login && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.login.message}
                </motion.p>
              )}
            </motion.div>

            {/* Password field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="password" className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Пароль
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: 'Пароль обязателен',
                    minLength: { value: 6, message: 'Пароль должен быть не менее 6 символов' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Введите ваш пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </motion.div>

            {/* Submit button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-lg font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="loading-dots">Вход</span>
              ) : (
                'Войти'
              )}
            </motion.button>
          </form>

          {/* Register link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600">
              Нет аккаунта?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline"
              >
                Зарегистрируйтесь
              </Link>
            </p>
          </motion.div>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
          >
            <div className="flex items-center mb-2">
              <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">Демо-данные:</span>
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <div>Админ: admin / admin123</div>
              <div>Студенты: ivanov, petrov, sidorova / student123</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;