import React from 'react';
import { Search } from 'lucide-react';
import { UserFilters } from './types';

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: Partial<UserFilters>) => void;
}

const UserFiltersComponent: React.FC<UserFiltersProps> = ({ filters, onFiltersChange }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени или логину..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filters.filterRole}
          onChange={(e) => onFiltersChange({ filterRole: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Все роли</option>
          <option value="student">Ученики</option>
          <option value="admin">Администраторы</option>
        </select>
        <select
          value={filters.filterClass}
          onChange={(e) => onFiltersChange({ filterClass: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Все классы</option>
          {Array.from({ length: 7 }, (_, i) => i + 5).map(grade => (
            ['А', 'Б', 'В', 'Г'].map(letter => (
              <option key={`${grade}${letter}`} value={`${grade}${letter}`}>
                {grade}{letter} класс
              </option>
            ))
          ))}
        </select>
      </div>
    </div>
  );
};

export default UserFiltersComponent;
