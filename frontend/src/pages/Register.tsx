import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, GraduationCap, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface RegisterFormData {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    const success = await registerUser(data);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-4"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold gradient-text mb-2"
            >
              Регистрация
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600"
            >
              Создайте аккаунт школьника
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Login */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="label">
                <User className="w-4 h-4 inline mr-2" />
                Логин
              </label>
              <input
                {...register('login', { 
                  required: 'Логин обязателен',
                  minLength: { value: 3, message: 'Минимум 3 символа' }
                })}
                type="text"
                className={`input ${errors.login ? 'input-error' : ''}`}
                placeholder="Введите логин"
              />
              {errors.login && (
                <p className="text-red-500 text-sm mt-1">{errors.login.message}</p>
              )}
            </motion.div>



            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="label">Имя</label>
                <input
                  {...register('firstName', { required: 'Имя обязательно' })}
                  type="text"
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="Имя"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="label">Фамилия</label>
                <input
                  {...register('lastName', { required: 'Фамилия обязательна' })}
                  type="text"
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Фамилия"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </motion.div>
            </div>

            {/* Class */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="label">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Класс
                </label>
                <select
                  {...register('classGrade', { 
                    required: 'Выберите класс',
                    min: { value: 5, message: 'Класс должен быть от 5 до 11' },
                    max: { value: 11, message: 'Класс должен быть от 5 до 11' }
                  })}
                  className={`input ${errors.classGrade ? 'input-error' : ''}`}
                >
                  <option value="">Выберите класс</option>
                  {[5, 6, 7, 8, 9, 10, 11].map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                {errors.classGrade && (
                  <p className="text-red-500 text-sm mt-1">{errors.classGrade.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="label">Буква класса</label>
                <select
                  {...register('classLetter', { required: 'Выберите букву класса' })}
                  className={`input ${errors.classLetter ? 'input-error' : ''}`}
                >
                  <option value="">Буква</option>
                  {['А', 'Б', 'В', 'Г'].map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
                {errors.classLetter && (
                  <p className="text-red-500 text-sm mt-1">{errors.classLetter.message}</p>
                )}
              </motion.div>
            </div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label className="label">
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
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Создайте пароль"
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
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </motion.div>

            {/* Submit button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-lg font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="loading-dots">Регистрация</span>
              ) : (
                'Зарегистрироваться'
              )}
            </motion.button>
          </form>

          {/* Login link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <Link 
                to="/login" 
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors hover:underline"
              >
                Войти
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;