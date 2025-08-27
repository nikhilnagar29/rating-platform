// frontend/src/pages/User/EditRating.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditRatingForm from '../../components/user/EditRatingForm';

const EditRatingPage = () => {
  const { ratingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(null);
  const [score , setScore] = useState(0) ;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch rating details (this includes store_name) ---
        const ratingResponse = await axios.get(`${import.meta.env.VITE_API_URL}/user/rating/${ratingId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        const fetchedRating = ratingResponse.data.rating;
        // --- Add a check to ensure fetchedRating is an object ---
        if (fetchedRating && typeof fetchedRating === 'object') {
             setRating(fetchedRating);
        } else {
            throw new Error('Invalid rating data received from server.');
        }
        // --- End of addition ---

      } catch (err) {
        console.error('Error fetching data for edit rating:', err);
        if (err.response?.status === 404) {
            setError('Rating not found or access denied.');
        } else if (err.response?.status === 400) {
             setError(err.response.data.message || 'Invalid rating ID.');
        } else {
             // Handle the case where fetchedRating is invalid
             if (err.message === 'Invalid rating data received from server.') {
                 setError(err.message);
             } else {
                 setError('Failed to load rating details. Please try again.');
             }
        }
      } finally {
        setLoading(false);
      }
    };

    if (ratingId) {
        fetchData();
    } else {
        setError('Rating ID is missing.');
        setLoading(false);
    }
  }, [ratingId]);

  const handleRatingUpdated = (updatedRating) => {
    console.log("Rating updated successfully:", updatedRating);
    alert("Your rating has been updated successfully!");
    navigate('/user');
  };

  if (loading) {
    return <div className="p-6 text-center">Loading rating details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <Link to="/user" className="text-blue-500 hover:underline">
          &larr; Back to Store List
        </Link>
      </div>
    );
  }

  // --- CRITICAL CHECK: Ensure rating object is fully loaded and valid ---
  // This prevents EditRatingForm from receiving an undefined initialRating prop.
  if (!rating || typeof rating !== 'object' || !rating.hasOwnProperty('rating_id')) {
      return <div className="p-6 text-center">Rating data is invalid or incomplete.</div>;
  }
  // --- END OF CRITICAL CHECK ---

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link
          to="/user"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Store List
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Your Rating</h1>
        <p className="text-gray-600 mb-6">
          For: <span className="font-semibold">{rating.store_name}</span>
        </p>

        {/* --- ANOTHER CRITICAL CHECK: Only render the form if rating is definitely an object --- */}
        {/* This acts as a final guard before passing props */}
        {rating && typeof rating === 'object' ? (
          <EditRatingForm
            initialRating={rating}
            storeName={rating.store_name}
            onRatingUpdated={handleRatingUpdated}
          />
        ) : (
          <div className="p-6 text-center text-red-500">Error: Rating data not available for editing.</div>
        )}
        {/* --- END OF ANOTHER CRITICAL CHECK --- */}
      </div>
    </div>
  );
};

export default EditRatingPage;