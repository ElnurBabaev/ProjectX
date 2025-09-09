export interface User {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
  personalPoints: number;
  role: string;
  createdAt: string;
}

export interface NewUser {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
  role: string;
}

export interface UserEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  location: string;
  points: number;
  status: 'attended' | 'registered';
}

export interface UserFilters {
  searchTerm: string;
  filterRole: string;
  filterClass: string;
}

export interface ModalState {
  showCreateModal: boolean;
  showEditModal: boolean;
  showPasswordModal: boolean;
  showUserEventsModal: boolean;
}
