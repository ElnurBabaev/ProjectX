import React from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import AuthStatus from './components/AuthStatus';
import ThemedToaster from './components/ThemedToaster';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Achievements from './pages/Achievements';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-black dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-400 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-400 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return user && user.isAdmin ? <>{children}</> : <Navigate to="/" />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-black">
      <AuthStatus />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPanel />
                        </AdminRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
            <ThemedToaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;