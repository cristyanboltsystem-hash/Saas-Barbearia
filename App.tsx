import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminServices from './pages/admin/Services';
import AdminProducts from './pages/admin/Products';
import AdminPackages from './pages/admin/Packages';
import AdminSubscribers from './pages/admin/Subscribers';
import AdminBarbers from './pages/admin/Barbers';
import AdminAppointments from './pages/admin/Appointments';
import AdminSettings from './pages/admin/Settings';
import AdminLevels from './pages/admin/Levels';

// Protected Route Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  // Check if role exists (either ADMIN or BARBER)
  const isAuthenticated = !!sessionStorage.getItem('userRole');
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
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="barbers" element={<AdminBarbers />} />
          <Route path="levels" element={<AdminLevels />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;