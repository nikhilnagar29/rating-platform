// frontend/src/components/user/EditRatingModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditRatingModal = ({ rating, onClose, onRatingUpdated }) => {
  const [score, setScore] = useState(rating.score);
  const [text, setText] = useState(rating.text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Ensure state updates if the 'rating' prop changes (though unlikely in this specific use case)
  useEffect(() => {
    setScore(rating.score);
    setText(rating.text || '');
  }, [rating]);

  const handleStarClick = (selectedScore) => {
    setScore(selectedScore);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (score < 1 || score > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      setIsSubmitting(false);
      return;
    }

    try {
      // --- Use the correct endpoint for editing ---
      // Using the one from your second example: PUT /api/user/rating/:ratingId
      // Make sure only one PUT endpoint exists for editing, or choose one consistently.
      // I'll use the one that seems simpler and matches the first example's structure more closely.
      // If you have issues, double-check your backend routes.
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/rating/${rating.rating_id}`,
        { score, text },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Rating updated via modal:', response.data);
      // Notify parent component (MyRatings) about the update
      if (onRatingUpdated) {
        onRatingUpdated(response.data.rating);
      }
      // onClose() is typically called by the parent after onRatingUpdated or here
      // onClose();

    } catch (err) {
      console.error('Error updating rating in modal:', err);
      let errorMsg = 'Failed to update rating. Please try again.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMsg = err.response.data.message || 'Rating not found.';
        } else if (err.response.status === 400) {
          errorMsg = err.response.data.message || 'Invalid rating data.';
        } else {
          errorMsg = err.response.data.message || errorMsg;
        }
      } else if (err.request) {
        errorMsg = 'Network error. Please check your connection.';
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Background overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      {/* Modal container */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            Edit Rating for {rating.store_name}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating Selection (Pre-filled) */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="text-4xl focus:outline-none transform transition duration-150 ease-in-out hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >
                    {star <= score ? (
                      <span className="text-yellow-400">★</span>
                    ) : (
                      <span className="text-gray-300">☆</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-sm text-gray-500">
                {score} Star{score > 1 ? 's' : ''}
              </p>
            </div>

            {/* Comment Textarea (Pre-filled) */}
            <div>
              <label htmlFor="ratingComment" className="block text-sm font-medium text-gray-700 mb-1">
                Comment (Optional)
              </label>
              <textarea
                id="ratingComment"
                name="text"
                rows="3"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your updated experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500 text-right">{text.length}/500</p>
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSubmitting
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
              >
                {isSubmitting ? 'Updating...' : 'Update Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRatingModal;