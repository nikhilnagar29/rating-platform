// frontend/src/pages/User/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import UserStoreTable from '../../components/user/UserStoreTable';
import MyRatings from './MyRatings';

const UserHome = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Explore Stores</h1>
          <p className="text-gray-600 mt-1">Find and rate your favorite stores.</p>
        </div>
        {/* --- Add Buttons --- */}
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Link
            to="/user/change-password"
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Change Password
          </Link>
          {/* --- New Button for My Ratings --- */}
          <Link
            to="/user/my-ratings"
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            My Ratings
          </Link>
          {/* ------------------------------- */}
        </div>
      </div>

      <section>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <UserStoreTable />
        </div>

        <div className="bg-white p-4 mt-4 rounded-lg shadow-sm">
          <MyRatings />
        </div>
        
      </section>
    </div>
  );
};

export default UserHome;