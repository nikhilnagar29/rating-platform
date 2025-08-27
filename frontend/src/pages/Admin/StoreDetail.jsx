// frontend/src/pages/Admin/StoreDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RatingTable from '../../components/admin/RatingTable'; // Reuse the existing RatingTable

const StoreDetail = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Store Details ---
  useEffect(() => {
    const fetchStoreDetails = async () => {
      setLoadingStore(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stores/${storeId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setStore(response.data.store);
      } catch (err) {
        console.error('Error fetching store details:', err);
        if (err.response?.status === 404) {
            setError('Store not found.');
        } else if (err.response?.status === 400) {
            setError(err.response.data.message || 'Invalid store ID.');
        } else {
            setError('Failed to load store details.');
        }
      } finally {
        setLoadingStore(false);
      }
    };

    if (storeId) {
        fetchStoreDetails();
    } else {
        setError('Store ID is missing.');
        setLoadingStore(false);
    }
  }, [storeId]);

  if (loadingStore) {
    return <div className="p-6 text-center">Loading store details...</div>;
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

  if (!store) {
      return <div className="p-6 text-center">Store data could not be loaded.</div>;
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

      {/* Store Info Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Store Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details for store ID: {store.id}</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.id}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.email || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Owner ID</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {/* Make Owner ID clickable */}
                <Link to={`/admin/user/${store.owner_id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                  {store.owner_id}
                </Link>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Owner Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.owner_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {store.average_rating > 0 ? store.average_rating : 'No Ratings'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.address}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(store.created_at).toLocaleString()}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(store.updated_at).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Ratings Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ratings for {store.name}</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {/* 
            Pass specific props to RatingTable to filter by this store 
            and hide the store columns since it's specific to this store.
          */}
          <RatingTable
            initialFilters={{ store_id: store.id }} // Pre-filter by this store's ID
            hideStoreColumns={true}                // Hide Store ID and Store Name columns
          />
        </div>
      </section>
    </div>
  );
};

export default StoreDetail;
