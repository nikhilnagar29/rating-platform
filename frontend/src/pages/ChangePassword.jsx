// frontend/src/pages/ChangePassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import axios from 'axios';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear specific field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general error if any field is changed
    if (generalError) {
      setGeneralError('');
    }
    // Clear success message if user starts typing again
    if (successMessage) {
        setSuccessMessage('');
    }
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.oldPassword) {
        tempErrors.oldPassword = 'Old password is required.';
        isValid = false;
    }

    if (!formData.newPassword) {
        tempErrors.newPassword = 'New password is required.';
        isValid = false;
    } else {
        // Basic frontend validation for new password (should match backend)
        if (formData.newPassword.length < 8 || formData.newPassword.length > 16) {
            tempErrors.newPassword = 'Password must be 8-16 characters.';
            isValid = false;
        } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
            tempErrors.newPassword = 'Password must include at least one uppercase letter.';
            isValid = false;
        } else if (!/(?=.*[!@#$%^&*])/.test(formData.newPassword)) { // Adjust special char regex as needed
            tempErrors.newPassword = 'Password must include at least one special character.';
            isValid = false;
        }
    }

    if (!formData.confirmPassword) {
        tempErrors.confirmPassword = 'Please confirm your new password.';
        isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match.';
        isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
        return;
    }

    setIsSubmitting(true);
    setGeneralError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/change-password`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Password changed successfully:', response.data);
      setSuccessMessage(response.data.message || 'Password updated successfully!');
      
      // Clear the form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Optional: Automatically redirect after a few seconds
      // setTimeout(() => navigate(-1), 3000); // Go back to previous page

    } catch (err) {
      console.error('Error changing password:', err);
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 400) {
            // Handle specific validation errors from backend
            // The backend sends a 'message' field
            setGeneralError(err.response.data.message || 'Bad Request');
        } else if (err.response.status === 404) {
             setGeneralError(err.response.data.message || 'User not found.');
        } else {
            setGeneralError(err.response.data.message || 'Failed to change password. Please try again.');
        }
      } else if (err.request) {
        // Request was made but no response received
        setGeneralError('Network error. Please check your connection.');
      } else {
        // Something else happened
        setGeneralError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Change Password</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
          {successMessage}
          <p className="mt-2 text-xs">You will be redirected shortly...</p>
          {/* Auto-redirect after success */}
          {/* {setTimeout(() => navigate(-1), 3000)}  */}
        </div>
      )}

      {generalError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Old Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="oldPassword"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.oldPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.oldPassword && <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            8-16 chars, 1 uppercase, 1 special char.
          </p>
          {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-4 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
          
          <Link
            to="/user" // Adjust this link based on where the user should go back to (e.g., /owner/dashboard)
            className="w-full sm:w-auto px-4 py-2 text-center bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;