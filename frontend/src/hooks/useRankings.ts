import { useQuery } from 'react-query';
import api from '../utils/api';

export interface StudentRanking {
  id: number;
  first_name: string;
  last_name: string;
  class_grade: number;
  class_letter: string;
  avatar_url?: string;
  total_points: number;
  events_participated: number;
  rank_position: number;
}

export interface ClassRanking {
  class_grade: number;
  class_letter: string;
  total_points: number;
  students_count: number;
  avg_points_per_student: number;
  rank_position: number;
}

export interface RankingStats {
  totalStudents: number;
  totalClasses: number;
  totalPoints: number;
  userStats: {
    points: number;
    eventsParticipated: number;
    rank: number;
    classRank: number;
  };
}

// Хук для получения рейтинга учеников
export const useStudentRankings = () => {
  return useQuery<{
    rankings: StudentRanking[];
    currentUser: StudentRanking;
  }>('studentRankings', async () => {
    const response = await api.get('/rankings/students');
    return response.data;
  }, {
    refetchOnWindowFocus: false,
    staleTime: 0, // Данные сразу становятся устаревшими
    cacheTime: 60000, // Кэшируем на 1 минуту
  });
};

// Хук для получения рейтинга классов
export const useClassRankings = () => {
  return useQuery<{
    rankings: ClassRanking[];
    currentUserClass: ClassRanking;
  }>('classRankings', async () => {
    const response = await api.get('/rankings/classes');
    return response.data;
  }, {
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 60000,
  });
};

// Хук для получения топ-10 учеников
export const useTopStudents = () => {
  return useQuery<{ topStudents: StudentRanking[] }>('topStudents', async () => {
    const response = await api.get('/rankings/top-students');
    return response.data;
  }, {
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 60000,
  });
};

// Хук для получения рейтинга учеников по классу
export const useClassStudentRankings = (grade: number, letter: string) => {
  return useQuery<{ rankings: StudentRanking[] }>(
    ['classStudentRankings', grade, letter],
    async () => {
      const response = await api.get(`/rankings/students/${grade}/${letter}`);
      return response.data;
    },
    {
      enabled: !!grade && !!letter,
    }
  );
};

// Хук для получения статистики рейтинга
export const useRankingStats = () => {
  return useQuery<RankingStats>('rankingStats', async () => {
    const response = await api.get('/rankings/stats');
    return response.data;
  }, {
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 60000,
  });
};