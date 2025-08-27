// frontend/src/pages/Admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserTable from '../../components/admin/UserTable';
import StoreTable from '../../components/admin/StoreTable';
import RatingTable from '../../components/admin/RatingTable'; // Import the new component
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // --- Fetch REAL dashboard statistics from the backend ---
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        const dashboardData = response.data.dashboardData;

        setStats({
          totalUsers: dashboardData.totalUsers || 0,
          totalStores: dashboardData.totalStores || 0,
          totalRatings: dashboardData.totalRatings || 0,
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStats({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Link
            to="/admin/create/user"
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Create New User
          </Link>
          {/* You can add a "Create New Store" button here if needed */}
          {/* <Link
            to="/admin/create/store" // General create store page
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Create New Store
          </Link> */}
        </div>
      </div>

      {/* Dashboard Stats Summary */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingStats ? '...' : stats.totalUsers}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Total Stores</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingStats ? '...' : stats.totalStores}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Total Ratings</p>
            <p className="text-2xl font-bold text-gray-800">
              {loadingStats ? '...' : stats.totalRatings}
            </p>
          </div>
        </div>
      </section>

      {/* User Management Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Manage Users</h2>
          <div className="mt-2 sm:mt-0 sm:hidden">
            <Link
              to="/admin/create/user"
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Create New User
            </Link>
          </div>
        </div>
        <UserTable />
      </section>

      {/* Store Management Section */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Manage Stores</h2>
        </div>
        <StoreTable />
      </section>

      {/* Rating Management Section */}
      <section className="mt-8"> {/* Add margin top for separation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Manage Ratings</h2>
        </div>
        {/* Render the RatingTable Component */}
        <RatingTable />
      </section>
    </div>
  );
};

export default AdminDashboard;