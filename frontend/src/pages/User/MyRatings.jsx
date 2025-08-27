// frontend/src/pages/User/MyRatings.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EditRatingModal from '../../components/user/EditRatingModal'; // We'll create this next

const MyRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRating, setEditingRating] = useState(null); // State to hold the rating being edited

  const fetchUserRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simple fetch, no pagination for now as per request
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/ratings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
            sort: 'created_at', // Sort by creation date
            order: 'desc',     // Newest first
            page: 1,
            limit: 1000,       // Fetch a large number, or implement pagination if needed later
        }
      });
      setRatings(response.data.ratings);
    } catch (err) {
      console.error('Error fetching user ratings:', err);
      setError(err.response?.data?.message || 'Failed to load your ratings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRatings();
  }, []);

  const handleEditClick = (rating) => {
    setEditingRating(rating);
  };

  const handleRatingUpdated = (updatedRating) => {
    console.log("Rating updated in MyRatings:", updatedRating);
    // Update the rating in the local list
    setRatings(prevRatings =>
      prevRatings.map(r => r.rating_id === updatedRating.rating_id ? updatedRating : r)
    );
    setEditingRating(null); // Close the modal
    // Optionally, show a success message
  };

  const handleCloseModal = () => {
    setEditingRating(null);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading your ratings...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={fetchUserRatings}
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
        <h1 className="text-2xl font-bold text-gray-800">My Submitted Ratings</h1>
        <p className="text-gray-600 mt-1">View and edit your past ratings.</p>
      </div>

      {ratings.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
          You haven't submitted any ratings yet.
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
                  Rating
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted On
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ratings.map((rating) => (
                <tr key={rating.rating_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rating.store_name}</td>
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
                    {new Date(rating.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <button
                      onClick={() => handleEditClick(rating)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit Feedback
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Render the Edit Modal if a rating is being edited */}
      {editingRating && (
        <EditRatingModal
          rating={editingRating}
          onClose={handleCloseModal}
          onRatingUpdated={handleRatingUpdated}
        />
      )}
    </div>
  );
};

export default MyRatings;