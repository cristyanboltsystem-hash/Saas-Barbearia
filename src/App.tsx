import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminServices from './pages/admin/Services';
import AdminBarbers from './pages/admin/Barbers';
import AdminAppointments from './pages/admin/Appointments';

// Protected Route Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Client Side */}
        <Route path="/" element={<BookingPage />} />

        {/* Admin Side */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="barbers" element={<AdminBarbers />} />
          <Route path="appointments" element={<AdminAppointments />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;