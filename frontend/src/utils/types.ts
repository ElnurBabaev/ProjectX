export interface User {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  full_name: string;
  class: string;
  class_grade: number;
  class_letter: string;
  role: 'student' | 'admin';
  isAdmin: boolean;
  avatar_url?: string;
  points?: number;
  total_earned_points?: number;
  achievements_count?: number;
  events_count?: number;
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  current_participants: number;
  image_url?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  registration_status?: 'registered' | 'attended' | 'missed' | 'cancelled';
  registered_at?: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  type: 'participation' | 'excellence' | 'leadership' | 'community';
  points: number;
  badge_color: string;
  requirements?: string;
  created_at: string;
  awarded_at?: string;
  notes?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  name?: string;
  image_url?: string;
}

export interface Purchase {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  purchased_at: string;
  price_paid: number;
}

export interface Purchase {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  purchased_at: string;
  price_paid: number;
}

export interface Statistics {
  users: {
    total: number;
    students: number;
    admins: number;
  };
  events: {
    total: number;
    upcoming: number;
    completed: number;
  };
  products: {
    total: number;
    active: number;
  };
  achievements: {
    total_achievements: number;
    awarded_achievements: number;
  };
}

export interface AchievementStats {
  total_achievements: number;
  earned_achievements: number;
  total_points: number;
  recent_achievements: Achievement[];
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface LoginData {
  login: string;
  password: string;
}

export interface RegisterData {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  image_url?: string;
}

export interface AchievementFormData {
  title: string;
  description: string;
  icon: string;
  type: 'participation' | 'excellence' | 'leadership' | 'community';
  points?: number;
  requirements?: string;
  badge_color?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  image_url?: string;
}

export interface OrderFormData {
  items: {
    product_id: number;
    quantity: number;
  }[];
  shipping_address: string;
  notes?: string;
}

export interface UserFormData {
  login: string;
  password?: string;
  first_name: string;
  last_name: string;
  class_grade: number;
  class_letter: string;
  role?: 'student' | 'admin';
}