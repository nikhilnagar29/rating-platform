// frontend/src/pages/Admin/CreateStore.jsx
import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import CreateStoreForm from '../../components/admin/CreateStoreForm';

const AdminCreateStore = () => {
  const { userId } = useParams(); // Get userId from the URL parameter
  const navigate = useNavigate();

  const handleStoreCreated = (newStore) => {
    console.log("New store created:", newStore);
    alert(`Successfully created store: ${newStore.name}`);
    // Navigate back to the admin dashboard or a relevant page
    // You might want to navigate to a stores list page in the future
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
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Create Store {userId ? `for User ID: ${userId}` : ''}
      </h1>

      {/* The Form Component */}
      <CreateStoreForm userId={userId ? parseInt(userId, 10) : null} onStoreCreated={handleStoreCreated} />
    </div>
  );
};

export default AdminCreateStore;