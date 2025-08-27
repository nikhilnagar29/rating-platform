// frontend/src/pages/User/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // If you want a link to profile or other user pages
import UserStoreTable from '../../components/user/UserStoreTable'; // We'll create this

const UserHome = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Explore Stores</h1>
        <p className="text-gray-600 mt-1">Find and rate your favorite stores.</p>
      </div>

      {/* Store List Section */}
      <section>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <UserStoreTable />
        </div>
      </section>
    </div>
  );
};

export default UserHome;