// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
  });
  const [errors, setErrors] = useState({}); // For field-specific errors
  const [generalError, setGeneralError] = useState(''); // For general errors from backend
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

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

    // Name validation (Min 2, Max 60 chars as per corrected logic from previous steps)
    if (!formData.name) {
      tempErrors.name = 'Name is required.';
      isValid = false;
    } else if (formData.name.length < 2 || formData.name.length > 60) {
      tempErrors.name = 'Name must be between 2 and 60 characters.';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      tempErrors.email = 'Email is required.';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Invalid email format.';
      isValid = false;
    }

    // Password validation (8–16 chars, at least one uppercase, one special char)
    // Note: Your backend regex was slightly off. Correcting it here to match typical requirements.
    // Requires at least one lowercase, one uppercase, one special char or digit, total 8-16.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
    if (!formData.password) {
      tempErrors.password = 'Password is required.';
      isValid = false;
    } else if (!passwordRegex.test(formData.password)) {
      tempErrors.password = 'Password must be 8-16 characters, include at least one uppercase letter and one special character.';
      isValid = false;
    }

    // Address validation (Max 400 chars)
    if (formData.address && formData.address.length > 400) {
      tempErrors.address = 'Address must be less than 400 characters.';
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
        `${import.meta.env.VITE_API_URL}/user/register`, // Use the register endpoint
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('User registered successfully:', response.data);
      setSuccessMessage(response.data.message || 'Registration successful! Please log in.');
      
      // Clear the form
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
      });

      // Optional: Automatically redirect to login after a short delay
      // setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      console.error('Error registering user:', err);
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 400) {
            // Handle validation errors or "user exists" from backend
            // The backend sends either a general 'message' or an 'errors' array
            const data = err.response.data;
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                // If backend sends specific field errors
                const fieldErrors = {};
                data.errors.forEach(err => {
                    // Assume error message format is like "Field 'email' is invalid"
                    // or just the field name if structured differently
                    // This part might need adjustment based on exact backend error structure
                    if (err.field && err.message) {
                         fieldErrors[err.field] = err.message;
                    } else {
                         // Fallback: use the message as general error or try to parse
                         setGeneralError(data.message || 'Bad Request');
                    }
                });
                setErrors(fieldErrors);
            } else if (data.message) {
                 // If backend sends a general message
                 setGeneralError(data.message);
            } else {
                setGeneralError('Bad Request');
            }
        } else if (err.response.status === 409) { // Assuming 409 for conflict/user exists
             setGeneralError('User with this email already exists.');
        } else {
            setGeneralError(err.response.data.message || 'Registration failed. Please try again.');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign up for an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {/* Already have an account?{' '} */}
            {/* <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link> */}
          </p>
        </div>

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>You can now <Link to="/login" className="font-medium text-green-800 underline hover:text-green-900">log in</Link>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {generalError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{generalError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!successMessage && ( // Only show form if not successful
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Full Name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
              />
              <p className="mt-1 text-xs text-gray-500">8-16 chars, 1 uppercase, 1 special char.</p>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="address" className="sr-only">Address (Optional)</label>
              <textarea
                id="address"
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Address (Optional, max 400 chars)"
              ></textarea>
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              {formData.address && (
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {formData.address.length}/400
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up...
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </div>
        </form>
        )}
        {/* Link to Login Page */}
        <div className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;