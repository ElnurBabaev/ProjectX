import React, { useState } from 'react';
import { Trophy, Medal, Users, Target, TrendingUp, Star, Award, Crown, RefreshCw } from 'lucide-react';
import { useQueryClient } from 'react-query';
import {
  useStudentRankings,
  useClassRankings,
  useTopStudents,
  useRankingStats,
  useClassStudentRankings,
  type StudentRanking,
  type ClassRanking
} from '../hooks/useRankings';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarPath } from '../config/simple-images';

const Rankings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'myClass'>(user?.isAdmin ? 'students' : 'classes');
  const queryClient = useQueryClient();

  const { data: studentRankings, isLoading: studentsLoading, refetch: refetchStudents } = useStudentRankings();
  const { data: classRankings, isLoading: classesLoading, refetch: refetchClasses } = useClassRankings();
  const { data: topStudents, refetch: refetchTopStudents } = useTopStudents();
  const { data: rankingStats, isLoading: statsLoading, refetch: refetchStats } = useRankingStats();
  const { data: classStudentData, refetch: refetchClassStudents } = useClassStudentRankings(
    user?.class_grade || 0,
    user?.class_letter || ''
  );

  const handleRefreshData = async () => {
    // Очищаем весь кэш рейтингов
    queryClient.removeQueries(['studentRankings']);
    queryClient.removeQueries(['classRankings']);
    queryClient.removeQueries(['topStudents']);
    queryClient.removeQueries(['rankingStats']);
    queryClient.removeQueries(['classStudentRankings']);
    
    // Принудительно обновляем все данные
    await Promise.all([
      refetchStudents(),
      refetchClasses(),
      refetchTopStudents(),
      refetchStats(),
      refetchClassStudents()
    ]);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const StudentRankingCard: React.FC<{ student: StudentRanking; showClass?: boolean; highlight?: boolean }> = ({ 
    student, 
    showClass = true,
    highlight = false 
  }) => (
    <div className={`bg-white rounded-lg p-3 sm:p-4 border transition-all duration-200 hover:shadow-md ${
      highlight ? 'ring-1 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ранг - компактный */}
        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
          {getRankIcon(student.rank_position)}
        </div>
        
        {/* Аватар - адаптивный размер */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          <img 
            src={getAvatarPath(student.avatar_url)} 
            alt={`${student.first_name} ${student.last_name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/avatars/default.svg';
            }}
          />
        </div>
        
        {/* Основная информация - с контролем overflow */}
        <div className="flex-grow min-w-0">
          <h3 className={`text-xs sm:text-sm font-medium truncate ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>
            {student.first_name} {student.last_name}
            {highlight && <span className="text-blue-600"> (Вы)</span>}
          </h3>
          {showClass && (
            <p className="text-xs text-gray-500 truncate">
              {student.class_grade}{student.class_letter} класс
            </p>
          )}
        </div>
        
        {/* Очки - компактно */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xs sm:text-sm font-bold text-yellow-600 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="whitespace-nowrap">{student.total_points}</span>
          </div>
          {student.events_participated && (
            <div className="text-xs text-gray-500 mt-1">
              {student.events_participated} событий
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ClassRankingCard: React.FC<{ classData: ClassRanking; highlight?: boolean }> = ({ classData, highlight = false }) => (
    <div className={`bg-white rounded-lg p-3 sm:p-4 border transition-all duration-200 hover:shadow-md ${
      highlight ? 'ring-1 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ранг - компактный */}
        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
          {getRankIcon(classData.rank_position)}
        </div>
        
        {/* Основная информация о классе */}
        <div className="flex-grow min-w-0">
          <h3 className={`text-sm sm:text-base font-bold truncate ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>
            {classData.class_grade}{classData.class_letter} класс
            {highlight && <span className="text-blue-600"> (Ваш)</span>}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            {classData.students_count} учеников
          </p>
        </div>
        
        {/* Статистика - компактно */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xs sm:text-sm font-bold text-yellow-600 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="whitespace-nowrap">{classData.total_points}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="whitespace-nowrap">{classData.avg_points_per_student} ср.</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (studentsLoading || classesLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка рейтинга...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок - адаптивный */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900">
              <span className="emoji">🏆</span> Рейтинг школы
            </h1>
            <button
              onClick={handleRefreshData}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2 text-sm"
              title="Обновить данные рейтинга"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
          </div>
          <p className="text-sm sm:text-base lg:text-xl text-gray-600">
            Следите за своими достижениями и соревнуйтесь с одноклассниками
          </p>
        </div>

        {/* Статистика - мобильная сетка */}
        {rankingStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 border shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm truncate">Позиция</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">#{rankingStats.userStats.rank}</p>
                </div>
                <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-500 mt-2 lg:mt-0" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 border shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm truncate">Очки</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{rankingStats.userStats.points}</p>
                </div>
                <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-500 mt-2 lg:mt-0" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 border shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm truncate">Класс</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">#{rankingStats.userStats.classRank}</p>
                </div>
                <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-500 mt-2 lg:mt-0" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 border shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm truncate">События</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{rankingStats.userStats.eventsParticipated}</p>
                </div>
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-500 mt-2 lg:mt-0" />
              </div>
            </div>
          </div>
        )}

        {/* Топ-10 учеников - компактный список */}
        {topStudents && user?.isAdmin && (
          <div className="mb-6 lg:mb-8">
            <div className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 border shadow-sm">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2 lg:gap-3">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-500" />
                <span className="truncate">Топ-10 учеников</span>
              </h2>
              <div className="space-y-2 lg:space-y-3">
                {topStudents.topStudents.slice(0, 10).map((student) => (
                  <StudentRankingCard
                    key={student.id}
                    student={student}
                    highlight={student.id === user?.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Табы - мобильные */}
        <div className="bg-white rounded-lg lg:rounded-xl border shadow-sm">
          <div className="border-b">
            <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-4 lg:px-6 overflow-x-auto">
              {user?.isAdmin && (
                <button
                  onClick={() => setActiveTab('students')}
                  className={`py-3 lg:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'students'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Рейтинг</span> учеников
                  </div>
                </button>
              )}
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-3 lg:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'classes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Рейтинг</span> классов
                </div>
              </button>
              <button
                onClick={() => setActiveTab('myClass')}
                className={`py-3 lg:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'myClass'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  Мой класс
                </div>
              </button>
            </nav>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {activeTab === 'students' && user?.isAdmin && studentRankings && (
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
                  Общий рейтинг учеников ({studentRankings.rankings.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {studentRankings.rankings.map((student) => (
                    <StudentRankingCard
                      key={student.id}
                      student={student}
                      highlight={student.id === user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'classes' && classRankings && (
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
                  Рейтинг классов ({classRankings.rankings.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {classRankings.rankings.map((classData) => (
                    <ClassRankingCard
                      key={`${classData.class_grade}${classData.class_letter}`}
                      classData={classData}
                      highlight={
                        classData.class_grade === user?.class_grade && 
                        classData.class_letter === user?.class_letter
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'myClass' && classStudentData && user && (
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
                  Рейтинг {user.class_grade}{user.class_letter} класса ({classStudentData.rankings.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {classStudentData.rankings.map((student) => (
                    <StudentRankingCard
                      key={student.id}
                      student={student}
                      showClass={false}
                      highlight={student.id === user?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rankings;