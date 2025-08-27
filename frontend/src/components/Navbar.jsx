// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Rating Platform</div>
      <div className="flex items-center space-x-4">
        <span>Welcome, {user.name} ({user.role})</span>
        
        {/* Role-based Links */}
        {user.role === 'admin' && (
          <Link to="/admin" className="hover:underline">
            Admin Dashboard
          </Link>
        )}
        {user.role === 'normal_user' && (
          <Link to="/user" className="hover:underline">
            My Home
          </Link>
        )}
        {user.role === 'store_owner' && (
          <Link to="/owner" className="hover:underline">
            Owner Dashboard
          </Link>
        )}

        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;