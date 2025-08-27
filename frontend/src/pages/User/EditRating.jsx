// frontend/src/pages/User/EditRating.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditRatingForm from '../../components/user/EditRatingForm'; // We'll create this next

const EditRatingPage = () => {
  const { ratingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(null);
  const [store, setStore] = useState(null); // Fetch store details for context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch rating details
        const ratingResponse = await axios.get(`${import.meta.env.VITE_API_URL}/user/rating/${ratingId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        const fetchedRating = ratingResponse.data.rating;
        setRating(fetchedRating);

        // Fetch associated store details
        const storeResponse = await axios.get(`${import.meta.env.VITE_API_URL}/user/stores/${fetchedRating.store_id}`, {
             headers: {
               Authorization: `Bearer ${localStorage.getItem('authToken')}`,
             },
           });
        setStore(storeResponse.data.store);

      } catch (err) {
        console.error('Error fetching data for edit rating:', err);
        if (err.response?.status === 404) {
            setError('Rating not found.');
        } else if (err.response?.status === 400) {
             setError(err.response.data.message || 'Invalid rating ID.');
        } else {
            setError('Failed to load rating details. Please try again.');
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
    // Navigate back to the user's store list or the specific store page
    // Example: navigate(`/user/stores/${updatedRating.store_id}`);
    navigate('/user'); // Navigate back to main user page for now
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
          &larr; Back to Stores
        </Link>
      </div>
    );
  }

  if (!rating || !store) {
      return <div className="p-6 text-center">Rating or store data could not be loaded.</div>;
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

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Your Rating</h1>
        <p className="text-gray-600 mb-6">
          For: <span className="font-semibold">{store.name}</span>
        </p>

        <EditRatingForm
          initialRating={rating}
          storeName={store.name}
          onRatingUpdated={handleRatingUpdated}
        />
      </div>
    </div>
  );
};

export default EditRatingPage;