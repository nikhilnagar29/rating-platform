// frontend/src/components/admin/RatingTable.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Update the props destructuring ---
const RatingTable = ({ initialFilters = {}, hideUserColumns = false }) => {
  // --- State for data and UI ---
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- State for filters, sorting, pagination ---
  // --- Modify the initial filters state to use props ---
  const [filters, setFilters] = useState({
    store_id: '',
    user_id: '',
    score: '',
    status: '',
    ...initialFilters // Apply initial filters passed as props
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Default sort
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRatings: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10, // Default items per page
  });

  // --- Fetch ratings function ---
  const fetchRatings = async (filtersToUse = filters, sortToUse = sortConfig, pageToUse = pagination.currentPage, limitToUse = pagination.limit) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Add filters
      Object.entries(filtersToUse).forEach(([key, value]) => {
        // Only add filter if it has a value
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      // Add sorting
      params.append('sort', sortToUse.key);
      params.append('order', sortToUse.direction);

      // Add pagination
      params.append('page', pageToUse);
      params.append('limit', limitToUse);

      // Make API request
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/ratings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setRatings(response.data.ratings);
      setPagination(response.data.pagination); // Update pagination info from backend

    } catch (err) {
      console.error('Error fetching ratings:', err);
      // Handle specific error types if needed
      if (err.response?.status === 400) {
         setError(err.response.data.message || 'Invalid filter parameters.');
      } else {
         setError(err.response?.data?.message || 'Failed to load ratings.');
      }
      setRatings([]); // Clear ratings on error
      // Reset pagination on error to avoid stale data
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRatings: 0,
        hasNext: false,
        hasPrev: false,
        limit: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Effect to fetch ratings on initial load and when dependencies change ---
  useEffect(() => {
    fetchRatings();
  }, []); // Run once on mount

  // --- Handlers for UI interactions ---

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when filters change
    fetchRatings(filters, sortConfig, 1, pagination.limit);
  };

  const handleClearFilters = () => {
    // Reset filters, preserving initialFilters logic if needed
    // For this implementation, clearing means going back to the initial state provided by props or empty
    const resetFilters = {
        store_id: '',
        user_id: '',
        score: '',
        status: '',
        ...initialFilters // Re-apply any initial filters if they are meant to be base filters
    };
    setFilters(resetFilters);
    // Reset to page 1 and refetch
    fetchRatings(resetFilters, sortConfig, 1, pagination.limit);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    // Reset to page 1 when sorting changes
    fetchRatings(filters, newSortConfig, 1, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchRatings(filters, sortConfig, newPage, pagination.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination(prev => ({ ...prev, limit: newLimit }));
    // Reset to page 1 when limit changes
    fetchRatings(filters, sortConfig, 1, newLimit);
  };

  // --- Helper function for sort indicator ---
  const getSortIndicator = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return null;
  };

  // --- Render Loading, Error, or Table ---
  if (loading && ratings.length === 0) {
    return <div className="p-4 text-center">Loading ratings...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error: {error}</p>
        <button
          onClick={() => fetchRatings()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto"> {/* Enables horizontal scrolling on small screens */}
      {/* Filters Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        {/* --- In the filter grid layout, adjust the column count if user columns are hidden --- */}
        <div className={`grid gap-3 mb-3 ${
            hideUserColumns 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' // 4 columns if user cols hidden
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5'  // 5 columns if user cols shown
          }`}>
          <input
            type="number"
            name="store_id"
            placeholder="Filter by Store ID"
            value={filters.store_id}
            onChange={handleFilterChange}
            min="1"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {/* --- In the filter section, conditionally hide the User ID filter input --- */}
          {/* --- Conditionally render User ID filter input --- */}
          {!hideUserColumns && (
            <input
              type="number"
              name="user_id"
              placeholder="Filter by User ID"
              value={filters.user_id}
              onChange={handleFilterChange}
              min="1"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          )}
          <select
            name="score"
            value={filters.score}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Scores</option>
            {[1, 2, 3, 4, 5].map(score => (
              <option key={score} value={score}>{score} Star{score > 1 ? 's' : ''}</option>
            ))}
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex-1"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 flex-1"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Pagination Controls (Top) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
          <div className="mb-2 sm:mb-0">
            <label htmlFor="itemsPerPage" className="mr-2">Items per page:</label>
            <select
              id="itemsPerPage"
              value={pagination.limit}
              onChange={handleLimitChange}
              className="px-2 py-1 border border-gray-300 rounded"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div>
            Showing {ratings.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalRatings)} of {pagination.totalRatings} ratings
          </div>
        </div>
      </div>

      {/* Rating Table */}
      {ratings.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No ratings found.</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('rating_id')}
              >
                <div className="flex items-center">
                  ID {getSortIndicator('rating_id')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('store_id')}
              >
                <div className="flex items-center">
                  Store ID {getSortIndicator('store_id')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Store Name
              </th>
              {/* --- In the table header, conditionally render user columns --- */}
              {/* --- Conditionally render User ID header --- */}
              {!hideUserColumns && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('user_id')}
                >
                  <div className="flex items-center">
                    User ID {getSortIndicator('user_id')}
                  </div>
                </th>
              )}
              {/* --- and User Name header --- */}
              {!hideUserColumns && (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
              )}
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center">
                  Score {getSortIndicator('score')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comment
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('likes_count')}
              >
                <div className="flex items-center">
                  Likes {getSortIndicator('likes_count')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status {getSortIndicator('status')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created At {getSortIndicator('created_at')}
                </div>
              </th>
              {/* <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center">
                  Updated At {getSortIndicator('updated_at')}
                </div>
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ratings.map((rating) => (
              <tr key={rating.rating_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{rating.rating_id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{rating.store_id}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={rating.store_name}>{rating.store_name}</td>
                {/* --- In the table body, conditionally render user data cells --- */}
                {/* --- Conditionally render User ID data --- */}
                {!hideUserColumns && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{rating.user_id}</td>
                )}
                {/* --- and User Name data --- */}
                {!hideUserColumns && (
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={rating.user_name}>{rating.user_name}</td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {rating.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={rating.text}>{rating.text || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{rating.likes_count}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    rating.status === 'active' ? 'bg-green-100 text-green-800' :
                    rating.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rating.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {new Date(rating.created_at).toLocaleDateString()} {/* Format date */}
                </td>
                {/* <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {new Date(rating.updated_at).toLocaleDateString()}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls (Bottom) */}
      {ratings.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <span className="text-sm text-gray-700 mr-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`px-3 py-1 text-sm rounded ${
                  pagination.hasPrev
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`px-3 py-1 text-sm rounded ${
                  pagination.hasNext
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingTable;