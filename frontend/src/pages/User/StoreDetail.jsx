// frontend/src/pages/User/StoreDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import RatingForm from '../../components/user/RatingForm'; // Assuming you have this component

const UserStoreDetail = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [storeError, setStoreError] = useState(null);
  const [ratingsError, setRatingsError] = useState(null);
  const [userRating, setUserRating] = useState(null); // To track if user has rated

  // --- Fetch Store Details ---
  useEffect(() => {
    const fetchStoreDetails = async () => {
      setLoadingStore(true);
      setStoreError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/stores/${storeId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setStore(response.data.store);
      } catch (err) {
        console.error('Error fetching store details:', err);
        if (err.response?.status === 404) {
            setStoreError('Store not found.');
        } else if (err.response?.status === 400) {
            setStoreError(err.response.data.message || 'Invalid store ID.');
        } else {
            setStoreError('Failed to load store details.');
        }
      } finally {
        setLoadingStore(false);
      }
    };

    if (storeId) {
        fetchStoreDetails();
    } else {
        setStoreError('Store ID is missing.');
        setLoadingStore(false);
    }
  }, [storeId]);

  // --- Fetch Ratings for this Store ---
  useEffect(() => {
    const fetchStoreRatings = async () => {
      if (!storeId) return; // Don't fetch if storeId is not available
      setLoadingRatings(true);
      setRatingsError(null);
      try {
        // Fetch ratings for the specific store
        // We'll use the general /api/user/ratings endpoint and filter by store_id
        const params = new URLSearchParams({
          store_id: storeId, // Add store_id filter
          sort: 'created_at', // Sort by creation date
          order: 'desc', // Newest first
          page: 1,
          limit: 100, // Fetch a reasonable number, or implement pagination if needed
        });

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/ratings?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        setRatings(response.data.ratings);
        // Check if the current user has a rating in the list
        const currentUserRating = response.data.ratings.find(r => r.user_id === parseInt(localStorage.getItem('userId'))); // Assuming you store userId
        setUserRating(currentUserRating || null);

      } catch (err) {
        console.error('Error fetching ratings for store:', err);
        setRatingsError('Failed to load ratings for this store.');
        setRatings([]); // Clear ratings on error
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchStoreRatings();
  }, [storeId]); // Re-fetch if storeId changes

  // --- Handle Rating Submission (Refresh ratings list) ---
  const handleRatingSubmitted = async (newRating) => {
    console.log("New rating submitted:", newRating);
    // Update the local state to reflect the new rating
    setUserRating(newRating);
    // Refresh the ratings list
    // Simple way: re-fetch ratings
    // A more efficient way would be to add the new rating to the list locally
    try {
        setLoadingRatings(true);
        const params = new URLSearchParams({
          store_id: storeId,
          sort: 'created_at',
          order: 'desc',
          page: 1,
          limit: 100,
        });
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/ratings?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setRatings(response.data.ratings);
        setLoadingRatings(false);
    } catch (err) {
        console.error('Error refreshing ratings after submission:', err);
        setRatingsError('Rating submitted, but failed to refresh the list.');
        setLoadingRatings(false);
    }
    // You could also show a toast notification here
  };

  if (loadingStore) {
    return <div className="p-6 text-center">Loading store details...</div>;
  }

  if (storeError) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{storeError}</span>
        </div>
        <Link to="/user" className="text-blue-500 hover:underline">
          &larr; Back to Stores
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
          to="/user"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Stores
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
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.owner_name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{store.address}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {store.average_rating > 0 ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {store.average_rating} / 5
                  </span>
                ) : (
                  'No Ratings Yet'
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(store.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* User's Rating Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Rating</h2>
        {userRating ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">You rated this store:</p>
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-2xl">
                  {i < userRating.score ? '★' : '☆'}
                </span>
              ))}
              <span className="ml-2 text-lg font-bold text-green-800">{userRating.score}/5</span>
            </div>
            {userRating.text && (
              <p className="mt-2 text-gray-700 italic">"{userRating.text}"</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Rated on: {new Date(userRating.created_at).toLocaleDateString()}
            </p>
            {/* Link to edit rating if needed */}
            {/* <Link to={`/user/edit/rating/${userRating.rating_id}`} className="mt-2 inline-block text-sm text-blue-500 hover:underline">
              Edit your rating
            </Link> */}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Rate this Store</h3>
            <RatingForm storeId={storeId} storeName={store.name} onRatingSubmitted={handleRatingSubmitted} />
          </div>
        )}
      </section>

      {/* Ratings List Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Ratings for {store.name}</h2>
          <span className="text-sm text-gray-600">
            {ratings.length} {ratings.length === 1 ? 'Rating' : 'Ratings'}
          </span>
        </div>

        {loadingRatings ? (
          <div className="p-4 text-center bg-gray-50 rounded-lg">Loading ratings...</div>
        ) : ratingsError ? (
          <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
            Error: {ratingsError}
            <button
              onClick={() => window.location.reload()} // Simple retry
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        ) : ratings.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
            No ratings yet for this store. Be the first!
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.rating_id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < rating.score ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-700">{rating.score}/5</span>
                    </div>
                    {rating.text && (
                      <p className="mt-2 text-gray-700">{rating.text}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  By: <span className="font-medium">{rating.user_name || 'Anonymous User'}</span> {/* You might need to fetch user name */}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserStoreDetail;