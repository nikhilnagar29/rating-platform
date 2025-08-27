// frontend/src/pages/Owner/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import OwnerStoresList from '../../components/owener/StoresList';
import OwnerDashboardRatings from '../../components/owener/DashboardRatings';

const OwnerDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      <p>Hello, Store Owner! View your store's ratings.</p>

      <div className="flex flex-wrap gap-2 mt-4">
        {/* --- Corrected the typo: /owener/ -> /owner/ --- */}
        <Link
          to="/owner/change-password" // <-- Corrected path
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Change Password
        </Link>
        {/* --- New Button for My Ratings --- */}
        {/* ... */}
        {/* ------------------------------- */}
      </div>
      <div>
        <OwnerStoresList/>
      </div>
      <section>
        <OwnerDashboardRatings />
      </section>
    </div>
  );
};

export default OwnerDashboard;