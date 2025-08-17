import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ответов и ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Проверяем, не находимся ли мы уже на странице логина
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Перенаправляем на страницу логина только если мы не там
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/profile'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

export const eventsApi = {
  getAll: () => api.get('/events').then((r) => ({
    data: (r.data.events || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      max_participants: e.max_participants,
      current_participants: e.current_participants,
      start_date: e.start_date,
      end_date: e.end_date,
      image_url: e.image_url,
      status: e.status,
      created_at: e.created_at,
    }))
  })),
  getMy: () => api.get('/events/my/events').then((r) => ({
    data: (r.data.events || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      max_participants: e.max_participants,
      current_participants: e.current_participants,
      start_date: e.start_date,
      end_date: e.end_date,
      image_url: e.image_url,
      status: e.status,
      registration_status: e.registration_status,
      registered_at: e.registered_at,
    }))
  })),
  register: (eventId: number) => api.post(`/events/${eventId}/register`),
  unregister: (eventId: number) => api.delete(`/events/${eventId}/register`),
  getById: (eventId: number) => api.get(`/events/${eventId}`),
  create: (data: any) => api.post('/events', data),
  update: (id: number, data: any) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  getParticipants: (eventId: number) => api.get(`/events/${eventId}/participants`),
};

export const achievementsApi = {
  getAll: () => api.get('/achievements').then((r) => ({
    data: (r.data.achievements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      type: a.type,
      points: a.points,
      badge_color: a.badge_color,
      created_at: a.created_at,
    }))
  })),
  getMy: () => api.get('/achievements/my').then((r) => ({
    data: (r.data.achievements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      type: a.type,
      points: a.points,
      badge_color: a.badge_color,
      awarded_at: a.awarded_at,
      notes: a.notes,
    }))
  })),
  getStats: () => api.get('/achievements/stats'),
  create: (data: any) => api.post('/achievements', data),
  update: (id: number, data: any) => api.put(`/achievements/${id}`, data),
  delete: (id: number) => api.delete(`/achievements/${id}`),
  award: (achievementId: number, userId: number, notes?: string) => 
    api.post(`/achievements/${achievementId}/award/${userId}`, { notes }),
};

export const productsApi = {
  getAll: () => api.get('/products').then((r) => ({
    data: (r.data.products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image_url: p.image_url,
      stock_quantity: p.stock_quantity,
      category: p.category,
      is_active: p.is_active,
      created_at: p.created_at,
    }))
  })),
  getById: (productId: number) => api.get(`/products/${productId}`),
  createOrder: (data: any) => api.post('/products/order', data),
  getMyOrders: () => api.get('/products/orders/my').then((r) => ({
    data: (r.data.orders || []).map((o: any) => ({
      id: o.id,
      total_amount: o.total_amount,
      status: o.status,
      shipping_address: o.shipping_address,
      notes: o.notes,
      created_at: o.created_at,
      items: o.items || [],
    }))
  })),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const adminApi = {
  getStatistics: () => api.get('/admin/statistics'),
  getUsers: (params?: any) => api.get('/admin/users', { params }).then((r) => ({
    data: {
      users: (r.data.users || []).map((u: any) => ({
        id: u.id,
        login: u.login,
        firstName: u.first_name,
        lastName: u.last_name,
        classGrade: u.class_grade,
        classLetter: u.class_letter,
        personalPoints: u.points || 0,
        role: u.role,
        createdAt: u.created_at,
      }))
    }
  })),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (userId: number, data: any) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId: number) => api.delete(`/admin/users/${userId}`),
  resetPassword: (userId: number, newPassword: string) => 
    api.post(`/admin/users/${userId}/reset-password`, { newPassword }),
  updateUserPoints: (userId: number, points: number) => 
    api.post(`/admin/users/${userId}/update-points`, { points }),
  
  getEvents: () => api.get('/admin/events'),
  getProducts: () => api.get('/admin/products'),
  getAchievements: () => api.get('/admin/achievements'),
  
  getUsersStats: () => api.get('/admin/users-stats'),
  exportUsers: () => api.get('/admin/export/users', { responseType: 'blob' }),
  
  getAllOrders: () => api.get('/products/orders/all'),
  updateOrderStatus: (orderId: number, status: string) => 
    api.put(`/products/orders/${orderId}/status`, { status }),
};

export default api;