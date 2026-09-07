import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { role, loading, currentUser, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-campus-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">Đang tải thông tin xác thực...</p>
        </div>
      </div>
    );
  }

  // Not logged in (neither real auth nor demo session)
  if (!role && !currentUser && !userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to legitimate role home
    if (role === 'student') return <Navigate to="/student" replace />;
    if (role === 'manager' || role === 'truongPhong') return <Navigate to="/manager" replace />;
    if (role === 'superAdmin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
