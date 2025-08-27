// frontend/src/components/Owner/StoresList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OwnerStoresList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // For programmatic navigation if needed

  const fetchOwnerStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/owner/stores`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setStores(response.data.stores || []); // Ensure it's an array
    } catch (err) {
      console.error('Error fetching owner stores:', err);
      setError(err.response?.data?.message || 'Failed to load your stores.');
      setStores([]); // Ensure stores is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerStores();
  }, []);

  // Handler for row click navigation
  const handleRowClick = (storeId) => {
    navigate(`/owner/store/${storeId}`);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading your stores...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={fetchOwnerStores}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Stores</h1>
        <p className="text-gray-600 mt-1">Manage and view details of your stores.</p>
      </div>

      {stores.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
          You don't own any stores yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Rating
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Ratings
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Ratings (Last 5)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr
                  key={store.id}
                  onClick={() => handleRowClick(store.id)} // Make row clickable
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{store.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={store.address}>
                    {store.address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{store.email || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {store.average_rating > 0 ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {store.average_rating}
                      </span>
                    ) : (
                      'No Ratings'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{store.total_ratings_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {store.recent_ratings && store.recent_ratings.length > 0 ? (
                      <ul className="space-y-1">
                        {store.recent_ratings.map((rating) => (
                          <li key={rating.rating_id} className="flex items-center text-xs">
                            <span className="mr-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-xs ${i < rating.score ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </span>
                            <span>({rating.user_name || 'User'})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400">No recent ratings</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerStoresList;