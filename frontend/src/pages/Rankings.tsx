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
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const getPositionBadge = (position: number) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2";
    switch (position) {
      case 1:
        return `${baseClasses} bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg`;
      case 2:
        return `${baseClasses} bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg`;
      case 3:
        return `${baseClasses} bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const StudentRankingCard: React.FC<{ student: StudentRanking; showClass?: boolean; highlight?: boolean }> = ({ 
    student, 
    showClass = true,
    highlight = false 
  }) => (
    <div className={`bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-lg ${
      highlight ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center">
            {getRankIcon(student.rank_position)}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              <img 
                src={getAvatarPath(student.avatar_url)} 
                alt={`${student.first_name} ${student.last_name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback на дефолтный аватар, если путь недоступен
                  (e.currentTarget as HTMLImageElement).src = '/images/avatars/default.svg';
                }}
              />
            </div>
            
            <div>
              <h3 className={`font-semibold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>
                {student.first_name} {student.last_name}
                {highlight && <span className="ml-2 text-blue-600">(Вы)</span>}
              </h3>
              {showClass && (
                <p className="text-sm text-gray-500">
                  {student.class_grade}{student.class_letter} класс
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={getPositionBadge(student.rank_position)}>
            {getRankIcon(student.rank_position)}
            {student.rank_position}
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              {student.total_points} очков
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Trophy className="w-4 h-4 text-blue-500" />
              {student.events_participated || 0} мероприятий
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ClassRankingCard: React.FC<{ classData: ClassRanking; highlight?: boolean }> = ({ classData, highlight = false }) => (
    <div className={`bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-lg ${
      highlight ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center">
            {getRankIcon(classData.rank_position)}
          </div>
          
          <div>
            <h3 className={`text-xl font-bold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>
              {classData.class_grade}{classData.class_letter} класс
              {highlight && <span className="ml-2 text-blue-600">(Ваш класс)</span>}
            </h3>
            <p className="text-sm text-gray-500">
              {classData.students_count} учеников
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={getPositionBadge(classData.rank_position)}>
            {getRankIcon(classData.rank_position)}
            {classData.rank_position}
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              {classData.total_points} очков
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {classData.avg_points_per_student} среднее
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">🏆 Рейтинг школы</h1>
            <button
              onClick={handleRefreshData}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
              title="Обновить данные рейтинга"
            >
              <RefreshCw className="w-5 h-5" />
              Обновить
            </button>
          </div>
          <p className="text-xl text-gray-600">
            Следите за своими достижениями и соревнуйтесь с одноклассниками
          </p>
        </div>

        {/* Статистика */}
        {rankingStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Ваша позиция</p>
                  <p className="text-2xl font-bold text-blue-600">#{rankingStats.userStats.rank}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Ваши очки</p>
                  <p className="text-2xl font-bold text-yellow-600">{rankingStats.userStats.points}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Позиция класса</p>
                  <p className="text-2xl font-bold text-green-600">#{rankingStats.userStats.classRank}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Участие в мероприятиях</p>
                  <p className="text-2xl font-bold text-purple-600">{rankingStats.userStats.eventsParticipated}</p>
                </div>
                <Trophy className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Топ-10 учеников */}
        {topStudents && user?.isAdmin && (
          <div className="mb-8">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                Топ-10 учеников школы
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Табы */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {user?.isAdmin && (
                <button
                  onClick={() => setActiveTab('students')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'students'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Рейтинг учеников
                  </div>
                </button>
              )}
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'classes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Рейтинг классов
                </div>
              </button>
              <button
                onClick={() => setActiveTab('myClass')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'myClass'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Мой класс
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'students' && user?.isAdmin && studentRankings && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Общий рейтинг учеников ({studentRankings.rankings.length})
                </h3>
                <div className="space-y-4">
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
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Рейтинг классов ({classRankings.rankings.length})
                </h3>
                <div className="space-y-4">
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
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Рейтинг {user.class_grade}{user.class_letter} класса ({classStudentData.rankings.length})
                </h3>
                <div className="space-y-4">
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