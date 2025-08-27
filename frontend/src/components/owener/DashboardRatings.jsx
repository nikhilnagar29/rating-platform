// frontend/src/pages/Owner/DashboardRatings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OwnerDashboardRatings = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/owner/dashboard/ratings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setStores(response.data.stores || []);
      } catch (err) {
        console.error('Error fetching owner dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Store Ratings Overview</h1>

      {stores.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
          You don't own any stores with ratings yet.
        </div>
      ) : (
        <div className="space-y-8">
          {stores.map((storeData) => {
            const { store, ratings } = storeData;
            return (
              <div key={store.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                {/* Store Header */}
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg leading-6 font-medium text-gray-900">{store.name}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {store.address} {store.email && `(${store.email})`}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Avg. Rating: {store.average_rating > 0 ? store.average_rating : 'N/A'} / 5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ratings List */}
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-4">
                    Ratings ({ratings.length})
                  </h3>
                  {ratings.length === 0 ? (
                    <p className="text-gray-500 text-sm">No ratings yet for this store.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rating
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Comment
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Submitted On
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {ratings.map((rating) => (
                            <tr key={rating.rating_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div>{rating.user.name}</div>
                                <div className="text-xs text-gray-500">{rating.user.email}</div>
                                {/* Optional: Display user address if needed */}
                                {/* <div className="text-xs text-gray-400 truncate max-w-xs" title={rating.user.address}>{rating.user.address}</div> */}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-xl ${i < rating.score ? 'text-yellow-400' : 'text-gray-300'}`}>
                                      ★
                                    </span>
                                  ))}
                                  <span className="ml-1 font-semibold">{rating.score}/5</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={rating.text}>
                                {rating.text || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {new Date(rating.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboardRatings;