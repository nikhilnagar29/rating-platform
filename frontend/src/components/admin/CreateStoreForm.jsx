// frontend/src/components/admin/CreateStoreForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateStoreForm = ({ userId, onStoreCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    owner_id: userId || '', // Pre-fill if userId is passed as prop
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(!!userId); // If userId is known, start loading
  const navigate = useNavigate();

  // Fetch owner details if userId is provided
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!userId) return;
      try {
        setLoadingOwner(true);
        // Assuming you have an API endpoint to get user details by ID
        // Adjust the URL and headers as needed
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        const user = response.data.user;
        if (user.role !== 'store_owner') {
            setErrors(prev => ({ ...prev, owner_id: 'Selected user is not a store owner.' }));
        } else {
            setOwnerDetails(user);
            setFormData(prev => ({ ...prev, owner_id: userId })); // Ensure owner_id is set
        }
      } catch (err) {
        console.error('Error fetching owner details:', err);
        setErrors(prev => ({ ...prev, owner_id: 'Could not fetch owner details. Please try again.' }));
      } finally {
        setLoadingOwner(false);
      }
    };

    fetchOwnerDetails();
  }, [userId]);

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

    // Name validation (Min 2, Max 100 chars)
    if (!formData.name) {
      tempErrors.name = 'Store name is required.';
      isValid = false;
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      tempErrors.name = 'Store name must be between 2 and 100 characters.';
      isValid = false;
    }

    // Address validation (Max 400 chars)
    if (!formData.address) {
      tempErrors.address = 'Address is required.';
      isValid = false;
    } else if (formData.address.length > 400) {
      tempErrors.address = 'Address must be less than 400 characters.';
      isValid = false;
    }

    // Owner ID validation
    if (!formData.owner_id) {
        tempErrors.owner_id = 'Owner is required.';
        isValid = false;
    } else {
        const ownerIdInt = parseInt(formData.owner_id, 10);
        if (isNaN(ownerIdInt) || ownerIdInt <= 0) {
        tempErrors.owner_id = 'Owner ID must be a positive integer.';
        isValid = false;
        }
    }

    // Email validation (if provided)
    if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
        tempErrors.email = 'Invalid email format.';
        isValid = false;
        }
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
    setErrors({});

    try {
      // Prepare data for submission, ensuring owner_id is an integer
      const dataToSend = {
        ...formData,
        owner_id: parseInt(formData.owner_id, 10),
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/create/store`, dataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Store created:', response.data);
      alert(response.data.message || 'Store created successfully!');
      
      // Notify parent or perform action on success
      if (onStoreCreated) onStoreCreated(response.data.store);

      // Navigate back to admin dashboard or a stores list page if you have one
      navigate('/admin'); // Adjust as needed

    } catch (err) {
      console.error('Error creating store:', err);
      if (err.response) {
        if (err.response.status === 409) {
          setErrors({ email: 'Store email already exists.' });
        } else if (err.response.status === 400) {
          const data = err.response.data;
          // Handle specific field errors if backend provides them
          // For now, show general message
          if (data.message) {
            if (data.message.includes('owner_id')) {
                setErrors({ owner_id: data.message });
            } else if (data.message.includes('email')) {
                setErrors({ email: data.message });
            } else if (data.message.includes('name')) {
                setErrors({ name: data.message });
            } else if (data.message.includes('address')) {
                setErrors({ address: data.message });
            } else {
                 alert(data.message);
            }
          } else {
            alert('Bad Request: ' + (data.message || 'Please check your input.'));
          }
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      } else if (err.request) {
        alert('Network error. Please check your connection.');
      } else {
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Create New Store
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Owner Information Section */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Owner Information</h3>
          {loadingOwner ? (
            <p className="text-gray-500">Loading owner details...</p>
          ) : ownerDetails ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p><span className="font-medium">ID:</span> {ownerDetails.id}</p>
              <p><span className="font-medium">Name:</span> {ownerDetails.name}</p>
              <p><span className="font-medium">Email:</span> {ownerDetails.email}</p>
              <p><span className="font-medium">Role:</span> {ownerDetails.role}</p>
            </div>
          ) : (
            <div>
              <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-1">
                Owner ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="owner_id"
                name="owner_id"
                value={formData.owner_id}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.owner_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter Store Owner's User ID"
              />
              {errors.owner_id && <p className="mt-1 text-sm text-red-600">{errors.owner_id}</p>}
              <p className="mt-1 text-xs text-gray-500">Enter the User ID of an existing Store Owner.</p>
            </div>
          )}
          <input type="hidden" name="owner_id" value={formData.owner_id} /> {/* Hidden input to ensure it's sent */}
        </div>

        {/* Store Details Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Store Details</h3>
          
          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Store Name <span className="text-red-500">*</span>
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
              placeholder="Enter store name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Address Field */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
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
              placeholder="Enter store address (max 400 characters)"
            ></textarea>
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            {formData.address && (
              <p className="mt-1 text-xs text-gray-500 text-right">
                {formData.address.length}/400
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Store Email (Optional)
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
              placeholder="store@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
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
            {isSubmitting ? 'Creating...' : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStoreForm;