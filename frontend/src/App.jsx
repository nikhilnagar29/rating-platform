// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { isAuthenticated } from './utils/auth'; // Import the helper

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';

// User Pages
import UserHome from './pages/User/Home';

// Owner Pages
import OwnerDashboard from './pages/Owner/Dashboard';

// Other
import NotFound from './pages/NotFound';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check for user on initial load
    const checkUser = () => {
      if (isAuthenticated()) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse user data from localStorage", e);
            // If parsing fails, treat as not logged in
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false); // Done checking
    };

    checkUser();
  }, []); // Run only once on mount

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    // Optionally use navigate here if you had useNavigate, but for now, let ProtectedRoute/Navigate handle it.
  };

  if (loading) {
    // Optional: Show a loading spinner while checking auth state
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div>
      {/* Show Navbar only if user is logged in */}
      {user && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        {/* Public Route - Only accessible if NOT logged in */}
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to={`/${user?.role === 'admin' ? 'admin' : user?.role === 'normal_user' ? 'user' : 'owner'}`} replace /> : <LoginPage />}
        />

        {/* Protected Routes */}
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Routes>
                <Route index element={<AdminDashboard />} />
                {/* Add more admin routes here */}
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={['normal_user']}>
              <Routes>
                <Route index element={<UserHome />} />
                {/* Add more user routes here */}
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Owner Routes */}
        <Route
          path="/owner/*"
          element={
            <ProtectedRoute allowedRoles={['store_owner']}>
              <Routes>
                <Route index element={<OwnerDashboard />} />
                {/* Add more owner routes here */}
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Default Redirects */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to={`/${user?.role === 'admin' ? 'admin' : user?.role === 'normal_user' ? 'user' : 'owner'}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;