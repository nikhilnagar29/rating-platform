// frontend/src/components/user/EditRatingForm.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EditRatingForm = ({ initialRating, storeName, onRatingUpdated }) => {
  // --- ADD A GUARD CLAUSE AT THE VERY BEGINNING ---
  // Check if initialRating is provided and is an object.
  // If not, render an error message or return null to prevent the error.
  if (!initialRating || typeof initialRating !== 'object') {
    console.error('EditRatingForm: initialRating prop is missing or invalid:', initialRating);
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md border border-red-200">
        <p className="text-red-500">Error: Rating data is not available for editing.</p>
        <Link to="/user" className="mt-4 inline-block text-blue-500 hover:underline">
          &larr; Back to Store List
        </Link>
      </div>
    );
    // Alternatively, you could just return null to render nothing:
    // return null;
  }
  // --- END OF GUARD CLAUSE ---

  // Now it's safe to destructure or access properties
  const [score, setScore] = useState(initialRating.score);
  const [text, setText] = useState(initialRating.text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleStarClick = (selectedScore) => {
    setScore(selectedScore);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);
    setMessage('');

    if (score < 1 || score > 5) {
      setMessage('Please select a rating between 1 and 5 stars.');
      setSubmissionStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Hello ji");
      console.log("Submitting rating update for ID:", initialRating.rating_id); // Debug log
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/edit/rating/${initialRating.rating_id}`,
        { score, text },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Rating updated:', response.data);
      setMessage(response.data.message || 'Rating updated successfully!');
      setSubmissionStatus('success');

      if (onRatingUpdated) {
        onRatingUpdated(response.data.rating);
      }

    } catch (err) {
      console.error('Error updating rating:', err);
      let errorMsg = 'Failed to update rating. Please try again.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMsg = err.response.data.message || 'Rating not found or access denied.';
        } else if (err.response.status === 400) {
          errorMsg = err.response.data.message || 'Invalid rating data.';
        } else {
          errorMsg = err.response.data.message || errorMsg;
        }
      } else if (err.request) {
        errorMsg = 'Network error. Please check your connection.';
      }
      setMessage(errorMsg);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
      {message && (
        <div className={`mb-4 p-3 rounded-md text-sm ${submissionStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            {score} Star{score > 1 ? 's' : ''} (Previously: {initialRating.score})
          </p>
        </div>

        <div>
          <label htmlFor="ratingComment" className="block text-sm font-medium text-gray-700 mb-1">
            Comment (Optional)
          </label>
          <textarea
            id="ratingComment"
            name="text"
            rows="4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your updated experience..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-300 ease-in-out"
          ></textarea>
          <p className="mt-1 text-xs text-gray-500 text-right">{text.length}/500</p>
          {initialRating.text && (
             <p className="mt-1 text-xs text-gray-400">
               Previous comment: <span className="italic">{initialRating.text}</span>
             </p>
           )}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 font-bold rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-in-out ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 focus:ring-blue-400'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Rating'
            )}
          </button>
          <Link
            to="/user"
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-full shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditRatingForm;