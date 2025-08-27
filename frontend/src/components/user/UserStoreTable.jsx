// frontend/src/components/user/UserStoreTable.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // <-- Import Link

const UserStoreTable = () => {
  // --- State for data and UI ---
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- State for filters, sorting, pagination ---
  const [filters, setFilters] = useState({
    name: '',
    address: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Default sort
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStores: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10, // Default items per page
  });

  // --- Fetch stores function ---
  const fetchStores = async (filtersToUse = filters, sortToUse = sortConfig, pageToUse = pagination.currentPage, limitToUse = pagination.limit) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Add filters (only name and address for users)
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Add sorting
      params.append('sort', sortToUse.key);
      params.append('order', sortToUse.direction);

      // Add pagination
      params.append('page', pageToUse);
      params.append('limit', limitToUse);

      // Make API request to the USER endpoint
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/stores?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Auth token for user
        },
      });

      setStores(response.data.stores);
      setPagination(response.data.pagination); // Update pagination info from backend

    } catch (err) {
      console.error('Error fetching stores for user:', err);
      setError(err.response?.data?.message || 'Failed to load stores.');
      setStores([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalStores: 0,
        hasNext: false,
        hasPrev: false,
        limit: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Effect to fetch stores on initial load and when dependencies change ---
  useEffect(() => {
    fetchStores();
  }, []); // Run once on mount

  // --- Handlers for UI interactions ---

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when filters change
    fetchStores(filters, sortConfig, 1, pagination.limit);
  };

  const handleClearFilters = () => {
    setFilters({ name: '', address: '' });
    // Reset to page 1 and refetch
    fetchStores({ name: '', address: '' }, sortConfig, 1, pagination.limit);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    // Reset to page 1 when sorting changes
    fetchStores(filters, newSortConfig, 1, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchStores(filters, sortConfig, newPage, pagination.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination(prev => ({ ...prev, limit: newLimit }));
    // Reset to page 1 when limit changes
    fetchStores(filters, sortConfig, 1, newLimit);
  };

  // --- Helper function for sort indicator ---
  const getSortIndicator = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return null;
  };

  // --- Render Loading, Error, or Table ---
  if (loading && stores.length === 0) {
    return <div className="p-4 text-center">Loading stores...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error: {error}</p>
        <button
          onClick={() => fetchStores()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Filters Section - Tailored for User (Name, Address) */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <input
            type="text"
            name="name"
            placeholder="Search by Store Name"
            value={filters.name}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="text"
            name="address"
            placeholder="Search by Address"
            value={filters.address}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex-1"
            >
              Search
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
            Showing {stores.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalStores)} of {pagination.totalStores} stores
          </div>
        </div>
      </div>

      {/* User Store Table */}
      {stores.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No stores found. Try adjusting your search.</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center">
                  ID {getSortIndicator('id')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Store Name {getSortIndicator('name')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('average_rating')}
              >
                <div className="flex items-center">
                  Avg. Rating {getSortIndicator('average_rating')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Column for User's Rating */}
                <div className="flex items-center">
                  Your Rating
                </div>
              </th>
              {/* Future column for Action (Rate/Edit) */}
              {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{store.id}</td>
                {/* <td className="px-4 py-3 text-sm font-medium text-gray-900">{store.name}</td> */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link to={`/user/stores/${store.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {store.name}
                    </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={store.address}>{store.address}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {store.average_rating > 0 ? store.average_rating : 'No Ratings'}
                </td>
                {/* --- REPLACED CONTENT STARTS HERE --- */}
                {/* User's Rating Column */}
                <td className="px-4 py-3 text-sm text-gray-500">
                  {store.user_rating !== null ? (
                    <div className="flex items-center space-x-2">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {store.user_rating} Star{store.user_rating > 1 ? 's' : ''}
                      </span>
                      {/* --- Add Edit Link/Button --- */}
                      {/* IMPORTANT: Ensure your backend `/api/user/stores` returns `user_rating_id` */}
                      {store.user_rating_id && ( // Check if rating_id is available
                        <Link
                          to={`/user/edit/rating/${store.user_rating_id}`}
                          state={{ storeName: store.name }} // Optional: pass store name via state
                          className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                      {/* --------------------------- */}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Not Rated</span>
                  )}
                </td>
                {/* --- REPLACED CONTENT ENDS HERE --- */}
                {/* Future Action Cell */}
                {/* <td className="px-4 py-3 text-sm text-gray-500">
                  {store.user_rating !== null ? (
                    <button
                      // onClick={() => navigate(`/user/rate/${store.id}`)} // Example navigation
                      className="text-indigo-600 hover:text-indigo-900 text-xs"
                    >
                      Edit Rating
                    </button>
                  ) : (
                    <button
                      // onClick={() => navigate(`/user/rate/${store.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs"
                    >
                      Rate Store
                    </button>
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls (Bottom) */}
      {stores.length > 0 && (
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

export default UserStoreTable;