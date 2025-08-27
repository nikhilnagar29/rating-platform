// frontend/src/components/user/RatingForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const RatingForm = ({ storeId, storeName, onRatingSubmitted }) => {
  const [score, setScore] = useState(0); // 0 means no score selected initially
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' or 'error'
  const [message, setMessage] = useState('');

  const handleStarClick = (selectedScore) => {
    setScore(selectedScore);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);
    setMessage('');

    // Basic client-side validation
    if (score < 1 || score > 5) {
      setMessage('Please select a rating between 1 and 5 stars.');
      setSubmissionStatus('error');
      setIsSubmitting(false);
      return;
    }

    // Optional: Add validation for text length if needed by backend
    // if (text.length > 500) { // Example limit
    //   setMessage('Comment is too long (max 500 characters).');
    //   setSubmissionStatus('error');
    //   setIsSubmitting(false);
    //   return;
    // }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/rate/${storeId}`,
        { score, text },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Rating submitted:', response.data);
      setMessage(response.data.message || 'Thank you for your rating!');
      setSubmissionStatus('success');
      
      // Clear the form
      setScore(0);
      setText('');

      // Notify parent component if needed (e.g., to refresh a list)
      if (onRatingSubmitted) {
        onRatingSubmitted(response.data.rating);
      }

    } catch (err) {
      console.error('Error submitting rating:', err);
      let errorMsg = 'Failed to submit rating. Please try again.';
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 409) {
          errorMsg = err.response.data.message || 'You have already rated this store.';
        } else if (err.response.status === 400) {
          errorMsg = err.response.data.message || 'Invalid rating data.';
        } else if (err.response.status === 404) {
           errorMsg = err.response.data.message || 'Store not found.';
        } else {
          errorMsg = err.response.data.message || errorMsg;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMsg = 'Network error. Please check your connection.';
      }
      setMessage(errorMsg);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If submission was successful, show a special thank you message
  if (submissionStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl shadow-lg border border-green-200">
        <div className="text-center">
          {/* Animated Emoji */}
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          
          {/* Thank You Message */}
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-xl text-gray-600 mb-1">Your rating for <span className="font-semibold text-teal-700">{storeName}</span> has been submitted.</p>
          
          {/* Wow Message */}
          <div className="mt-6 p-4 bg-white rounded-xl shadow-inner inline-block">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Wow! 🙌
            </p>
            <p className="text-gray-600 mt-1">We appreciate your feedback.</p>
          </div>

          {/* Optional: Action Button */}
          <button
            onClick={() => setSubmissionStatus(null)} // Reset to show form again
            className="mt-6 px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold rounded-full shadow-md hover:from-teal-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            Rate Another Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Rate <span className="text-teal-600">{storeName}</span>
      </h2>

      {message && (
        <div className={`mb-4 p-3 rounded-md text-sm ${submissionStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating Selection */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Your Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button" // Important: prevent form submission
                onClick={() => handleStarClick(star)}
                className="text-4xl focus:outline-none transform transition duration-150 ease-in-out hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                {star <= score ? (
                  <span className="text-yellow-400">★</span> // Filled star
                ) : (
                  <span className="text-gray-300">☆</span> // Empty star
                )}
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className="mt-2 text-center text-sm text-gray-500">
              {score} Star{score > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Comment Textarea */}
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
            placeholder="Share your experience..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-300 ease-in-out"
          ></textarea>
          <p className="mt-1 text-xs text-gray-500 text-right">{text.length}/500</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting || score === 0}
            className={`px-8 py-3 w-full max-w-xs font-bold rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 ${
              isSubmitting || score === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 focus:ring-blue-400'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;