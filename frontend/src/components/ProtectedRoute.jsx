// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    // If not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  if (!user || !allowedRoles.includes(user.role)) {
    // If user role is not allowed, redirect to unauthorized or login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;