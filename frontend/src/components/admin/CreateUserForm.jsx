// frontend/src/components/admin/CreateUserForm.jsx
import React, { useState } from 'react';
import axios from 'axios'; // Make sure axios is installed

const CreateUserForm = ({ onUserCreated }) => { // onUserCreated is a callback prop
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'normal_user', // Default role
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    // Name validation (Min 2, Max 60 chars as per corrected logic)
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

    // Role validation
    if (!['admin', 'normal_user', 'store_owner'].includes(formData.role)) {
      tempErrors.role = 'Invalid role selected.';
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
    setErrors({}); // Clear previous errors

    try {
      // Replace with your actual API base URL helper or import.meta.env.VITE_API_URL
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/create/user`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Assuming JWT
          'Content-Type': 'application/json',
        },
      });

      console.log('User created:', response.data);
      // Show success message (e.g., using toast)
      alert(response.data.message || 'User created successfully!'); // Simple alert for now

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        role: 'normal_user',
      });

      // Notify parent component if needed (e.g., to refresh user list)
      if (onUserCreated) onUserCreated(response.data.user);

    } catch (err) {
      console.error('Error creating user:', err);
      // Handle errors from backend
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 409) {
          setErrors({ email: 'Email already exists.' });
        } else if (err.response.status === 400) {
          // Could be specific field errors or general message
          const data = err.response.data;
          if (data.message) {
             // If backend sends a general message
             alert(data.message);
          } else {
            // If backend sends field-specific errors (you might need to adjust this based on your backend response structure)
            // Example: { errors: { name: "Too short", email: "Invalid" } }
            // setErrors(data.errors || { general: data.message || 'Bad Request' });
             alert(data.message || 'Bad Request');
          }
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      } else if (err.request) {
        // Request was made but no response received
        alert('Network error. Please check your connection.');
      } else {
        // Something else happened
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter full name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="user@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter password"
          />
          <p className="mt-1 text-xs text-gray-500">Must be 8-16 chars, include uppercase & special char.</p>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        {/* Address Field */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter address (max 400 characters)"
          ></textarea>
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          {formData.address && (
            <p className="mt-1 text-xs text-gray-500 text-right">
              {formData.address.length}/400
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="normal_user">Normal User</option>
            <option value="store_owner">Store Owner</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;