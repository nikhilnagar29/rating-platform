// frontend/src/pages/Admin/CreateUser.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import CreateUserForm from '../../components/admin/CreateUserForm';

const AdminCreateUser = () => {
  const navigate = useNavigate(); // Hook to programmatically navigate

  const handleUserCreated = (newUser) => {
    console.log("New user created:", newUser);
    alert(`Successfully created user: ${newUser.name}`);
    // Navigate back to the admin dashboard after successful creation
    navigate('/admin');
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Breadcrumb / Back Button */}
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {/* Simple back arrow using Tailwind */}
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New User</h1>

      {/* The Form Component */}
      <CreateUserForm onUserCreated={handleUserCreated} />
    </div>
  );
};

export default AdminCreateUser;