// frontend/src/components/admin/StoreTable.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- Update props destructuring to include apiUrl ---
const StoreTable = ({ initialFilters = {}, hideOwnerColumn = false, apiUrl = null }) => {
  // --- State for data and UI ---
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Remove local filter state if using a specific apiUrl, or keep minimal filters if apiUrl supports them
  // For this specific owner endpoint, we don't need local filters in the component.
  // If apiUrl is provided, we assume it gives us the exact data needed.
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    address: '',
    owner_id: '', // Keep if apiUrl is /stores and you want to allow filtering
    ...initialFilters
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStores: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });

  // --- Fetch stores function ---
  const fetchStores = async (filtersToUse = filters, sortToUse = sortConfig, pageToUse = pagination.currentPage, limitToUse = pagination.limit) => {
    setLoading(true);
    setError(null);
    try {
      let requestUrl;
      let requestParams = {};

      if (apiUrl) {
        // --- Use the provided specific API URL ---
        // e.g., apiUrl = `/api/admin/stores/owner/123`
        // This URL should return the data directly without needing complex filter building in the FE component.
        requestUrl = `${import.meta.env.VITE_API_URL}${apiUrl}`;
        // If the specific apiUrl supports query params for sorting/pagination, add them.
        // For now, assume the specific endpoint returns what's needed.
        // If needed later:
        // requestParams = { params: { sort: sortToUse.key, order: sortToUse.direction, page: pageToUse, limit: limitToUse } };
      } else {
        // --- Use the default general API URL with filter building ---
        requestUrl = `${import.meta.env.VITE_API_URL}/admin/stores`;
        const params = new URLSearchParams();
        // Add filters (only if using the general endpoint)
        Object.entries(filtersToUse).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                if (key === 'owner_id') {
                    const ownerIdInt = parseInt(value, 10);
                    if (!isNaN(ownerIdInt) && ownerIdInt > 0) {
                        params.append(key, ownerIdInt);
                    }
                } else {
                     params.append(key, value);
                }
            }
        });
        // Add sorting
        params.append('sort', sortToUse.key);
        params.append('order', sortToUse.direction);
        // Add pagination
        params.append('page', pageToUse);
        params.append('limit', limitToUse);
        requestParams = { params }; // Pass params via the `params` option for axios
      }

      // Make API request
      const response = await axios.get(requestUrl, {
        ...requestParams, // Spread params if using general endpoint
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      // --- Handle response structure ---
      // The new endpoint returns { stores: [...] }
      // The old endpoint returns { stores: [...], pagination: {...} }
      if (apiUrl) {
        // Assume specific endpoint returns { stores: [...] } or just the array
        // Adjust based on your new endpoint's exact response structure
        if (Array.isArray(response.data)) {
             setStores(response.data);
             // Set dummy pagination if not provided
             setPagination({
                currentPage: 1,
                totalPages: 1,
                totalStores: response.data.length,
                hasNext: false,
                hasPrev: false,
                limit: response.data.length || 10,
             });
        } else {
            setStores(response.data.stores || []);
            // Handle potential message or other data from specific endpoint
            if (response.data.message) {
                console.log(response.data.message); // Log message if present
            }
            // Set dummy pagination or handle if endpoint provides it later
             setPagination({
                currentPage: 1,
                totalPages: 1,
                totalStores: response.data.stores?.length || 0,
                hasNext: false,
                hasPrev: false,
                limit: response.data.stores?.length || 10,
             });
        }
      } else {
        // Handle response from general /admin/stores endpoint
        setStores(response.data.stores);
        setPagination(response.data.pagination);
      }

    } catch (err) {
      console.error('Error fetching stores:', err);
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

  // --- Effect to fetch stores on initial load ---
  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount. If apiUrl changes, this won't re-run unless added to deps.
  // Consider adding apiUrl to deps if it can change: useEffect(() => { fetchStores(); }, [apiUrl]);

  // --- Handlers for UI interactions (mostly for general endpoint) ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    if (!apiUrl) { // Only apply local filters if not using specific apiUrl
        fetchStores(filters, sortConfig, 1, pagination.limit);
    }
  };

  const handleClearFilters = () => {
    if (!apiUrl) { // Only clear local filters if not using specific apiUrl
        const resetFilters = {
            name: '',
            email: '',
            address: '',
            owner_id: '',
            ...initialFilters
        };
        setFilters(resetFilters);
        fetchStores(resetFilters, sortConfig, 1, pagination.limit);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    fetchStores(filters, newSortConfig, pagination.currentPage, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    if (!apiUrl && newPage > 0 && newPage <= pagination.totalPages) { // Only for general endpoint with pagination
      fetchStores(filters, sortConfig, newPage, pagination.limit);
    }
  };

  const handleLimitChange = (e) => {
    if (!apiUrl) { // Only for general endpoint with pagination
        const newLimit = parseInt(e.target.value, 10);
        setPagination(prev => ({ ...prev, limit: newLimit }));
        fetchStores(filters, sortConfig, 1, newLimit);
    }
  };

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
      {/* Filters Section - Only show if not using specific apiUrl */}
      {!apiUrl && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
          <div className={`grid gap-3 mb-3 ${
              hideOwnerColumn ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5'
            }`}>
            <input
              type="text"
              name="name"
              placeholder="Filter by Name"
              value={filters.name}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              name="email"
              placeholder="Filter by Email"
              value={filters.email}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              name="address"
              placeholder="Filter by Address"
              value={filters.address}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {!hideOwnerColumn && (
              <input
                type="number"
                name="owner_id"
                placeholder="Filter by Owner ID"
                value={filters.owner_id}
                onChange={handleFilterChange}
                min="1"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            )}
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
      )}

      {/* Store Table */}
      {stores.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No stores found.</div>
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
                  Name {getSortIndicator('name')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  Email {getSortIndicator('email')}
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
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created At {getSortIndicator('created_at')}
                </div>
              </th>
              {!hideOwnerColumn && (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner ID
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{store.id}</td>
                {/* <td className="px-4 py-3 text-sm font-medium text-gray-900">{store.name}</td> */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link to={`/admin/store/${store.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {store.name}
                    </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{store.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={store.address}>{store.address}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {store.average_rating > 0 ? store.average_rating : 'No Ratings'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(store.created_at).toLocaleDateString()}
                </td>
                {!hideOwnerColumn && (
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <Link to={`/admin/user/${store.owner_id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {store.owner_id}
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls - Only show if not using specific apiUrl */}
      {!apiUrl && stores.length > 0 && (
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

export default StoreTable;