// frontend/src/pages/Owner/StoreDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const OwnerStoreDetail = () => {
  const { storeId } = useParams();

  const [storeData, setStoreData] = useState({
    store: null,
    metrics: null,
    ratings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/owner/store/${storeId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        // Optional: Add query params for sorting if needed later
        // params: { sort: 'created_at', order: 'desc' }
      });
      setStoreData(response.data);
    } catch (err) {
      console.error('Error fetching owner store detail data:', err);
      let errorMsg = 'Failed to load store details.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMsg = 'Store not found or access denied.';
        } else if (err.response.status === 400) {
           errorMsg = err.response.data.message || 'Invalid request.';
        } else {
            errorMsg = err.response.data.message || errorMsg;
        }
      } else if (err.request) {
        errorMsg = 'Network error. Please check your connection.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchData();
    } else {
      setError('Store ID is missing.');
      setLoading(false);
    }
  }, [storeId]);

  if (loading) {
    return <div className="p-6 text-center">Loading store details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <Link to="/owner" className="text-blue-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const { store, metrics, ratings } = storeData;

  if (!store) {
      return <div className="p-6 text-center">Store data could not be loaded.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Breadcrumb / Back Button */}
      <div className="mb-6">
        <Link
          to="/owner"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Store Info Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Store Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details for {store.name}</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.id}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">{store.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.email || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.address}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(store.created_at).toLocaleDateString()}
              </dd>
            </div>
            {/* Metrics */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {metrics && metrics.average_rating > 0 ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {metrics.average_rating} / 5
                  </span>
                ) : (
                  'No Ratings Yet'
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Ratings</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {metrics ? metrics.total_ratings_count : '0'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Ratings List Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Customer Ratings</h2>
          <span className="text-sm text-gray-600">
            {ratings ? ratings.length : 0} {ratings && ratings.length === 1 ? 'Rating' : 'Ratings'}
          </span>
        </div>

        {ratings && ratings.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
            No ratings submitted for this store yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
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
              {ratings && ratings.map((rating) => (
                <tr key={rating.rating_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div>{rating.user_name}</div>
                    <div className="text-xs text-gray-500">{rating.user_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < rating.score ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                      <span className="ml-1">{rating.score}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={rating.text}>
                    {rating.text || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(rating.rating_created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </div>
  );
};

export default OwnerStoreDetail;