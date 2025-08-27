// frontend/src/pages/User/StoreDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Removed useNavigate as we won't use it for navigation to edit page
import axios from 'axios';
import RatingForm from '../../components/user/RatingForm';
import EditRatingModal from '../../components/user/EditRatingModal'; // Import the modal

const UserStoreDetail = () => {
  const { storeId } = useParams();

  // --- State Management ---
  const [storeData, setStoreData] = useState({
    store: null,
    userRating: null,
    allRatings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  
  // --- State for Edit Modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ratingToEdit, setRatingToEdit] = useState(null);
  // --------------------------

  // --- Fetch All Data ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/stores/${storeId}/detail`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setStoreData(response.data);
    } catch (err) {
      console.error('Error fetching store detail data:', err);
      let errorMsg = 'Failed to load store details.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMsg = 'Store not found.';
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

  // --- Initial Data Fetch ---
  useEffect(() => {
    if (storeId) {
      fetchData();
    } else {
      setError('Store ID is missing.');
      setLoading(false);
    }
  }, [storeId]);

  // --- Handle Rating Submission (Refreshes the entire page data) ---
  const handleRatingSubmitted = (submittedRating) => {
    console.log("New rating submitted:", submittedRating);
    fetchData(); // Reload all data to reflect the new rating
    setShowRatingForm(false); // Hide the form
    // Optional: Show a success message/toast here
  };

  // --- Handle Rating Update (from Modal - Refreshes the entire page data) ---
  const handleRatingUpdated = (updatedRating) => {
    console.log("Rating updated via modal:", updatedRating);
    fetchData(); // Reload all data to reflect the updated rating
    setIsEditModalOpen(false); // Close the modal
    setRatingToEdit(null); // Clear the rating to edit
    // Optional: Show a success message/toast here
  };

  // --- Handle Edit Button Click (Opens Modal) ---
  const handleEditClick = () => {
    // Set the rating to be edited and open the modal
    if (storeData.userRating) {
        setRatingToEdit(storeData.userRating);
        setIsEditModalOpen(true);
    }
  };

  // --- Handle Closing the Modal ---
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setRatingToEdit(null);
  };

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
        <Link to="/user" className="text-blue-500 hover:underline">
          &larr; Back to Stores
        </Link>
      </div>
    );
  }

  const { store, userRating, allRatings } = storeData;

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
        {/* ... (store info card content remains the same) ... */}
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Feedback</h2>
        {userRating ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">You rated this store:</p>
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-2xl ${i < userRating.score ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
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
            {/* --- Changed button onClick handler --- */}
            <button
              onClick={handleEditClick} // Opens the modal instead of navigating
              className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit Feedback
            </button>
            {/* ------------------------------------ */}
          </div>
        ) : showRatingForm ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Rate this Store</h3>
            {/* --- Use the new handler for submission --- */}
            <RatingForm storeId={storeId} storeName={store.name} onRatingSubmitted={handleRatingSubmitted} />
            {/* --------------------------------------- */}
          </div>
        ) : (
          <div className="bg-gray-100 p-6 rounded-lg border border-gray-300 text-center">
            <p className="text-gray-700 mb-4">You haven't rated this store yet.</p>
            <button
              onClick={() => setShowRatingForm(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Give Feedback
            </button>
          </div>
        )}
      </section>

      {/* Ratings List Section (Feedback from Others) */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Feedback from Others</h2>
          <span className="text-sm text-gray-600">
            {allRatings.length} {allRatings.length === 1 ? 'Rating' : 'Ratings'}
          </span>
        </div>

        {allRatings.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
            No feedback yet from other users.
          </div>
        ) : (
          <div className="space-y-4">
            {allRatings.map((rating) => (
              <div key={rating.rating_id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                {/* ... (ratings list content remains the same) ... */}
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
                  By: <span className="font-medium">{rating.user_name || 'A User'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Render the Edit Modal if it's open --- */}
      {isEditModalOpen && ratingToEdit && (
        <EditRatingModal
          rating={ratingToEdit}
          onClose={handleCloseModal}
          onRatingUpdated={handleRatingUpdated} // Use the specific handler for updates
        />
      )}
      {/* ----------------------------------------- */}
    </div>
  );
};

export default UserStoreDetail;