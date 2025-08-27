// frontend/src/pages/Admin/UserDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RatingTable from '../../components/admin/RatingTable'; // Reuse the existing RatingTable
import StoreTable from '../../components/admin/StoreTable'; // Reuse the existing StoreTable

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch User Details ---
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoadingUser(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setUser(response.data.user);
      } catch (err) {
        console.error('Error fetching user details:', err);
        if (err.response?.status === 404) {
            setError('User not found.');
        } else if (err.response?.status === 400) {
            setError(err.response.data.message || 'Invalid user ID.');
        } else {
            setError('Failed to load user details.');
        }
      } finally {
        setLoadingUser(false);
      }
    };

    if (userId) {
        fetchUserDetails();
    } else {
        setError('User ID is missing.');
        setLoadingUser(false);
    }
  }, [userId]);

  if (loadingUser) {
    return <div className="p-6 text-center">Loading user details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <Link to="/admin" className="text-blue-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!user) {
      return <div className="p-6 text-center">User data could not be loaded.</div>;
  }

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

      {/* User Info Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details for user ID: {user.id}</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'normal_user' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {user.role.replace('_', ' ')}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.address || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(user.updated_at).toLocaleString()}</dd>
            </div>
            {/* Conditional Store Rating for Store Owners */}
            {user.role === 'store_owner' && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Store Rating</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.store_rating !== undefined ? user.store_rating : 'Loading...'}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Conditional Content based on Role */}
      {user.role === 'normal_user' && (
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Ratings Submitted by {user.name}</h2>
          {/* 
            Pass specific props to RatingTable to filter by this user 
            and potentially hide the user filter/columns since it's specific to this user.
            We can achieve this by passing `initialFilters` or by creating a simplified version.
            For now, we'll pass initial filters.
          */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {/* Pass initial filter for user_id */}
            <RatingTable initialFilters={{ user_id: user.id }} hideUserColumns={true} />
          </div>
        </section>
      )}

      {user.role === 'store_owner' && (
        <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Stores Owned by {user.name}</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {/* 
            Pass the specific API URL for fetching stores by owner ID.
            Pass hideOwnerColumn to simplify the table view.
            No need for initialFilters as the backend handles the filtering.
          */}
          <StoreTable
            apiUrl={`/admin/stores/owner/${user.id}`} // Use the new endpoint
            hideOwnerColumn={true}                   // Hide Owner ID column as it's implied
            // initialFilters={{ owner_id: user.id }} // Not needed with specific apiUrl
            // hideOwnerColumn={true}                // Already passed
          />
        </div>
      </section>
      )}

      {/* Optional: Add sections for 'admin' role if needed in the future */}
    </div>
  );
};

export default UserDetail;