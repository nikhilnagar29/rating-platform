// frontend/src/components/admin/UserTable.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate,Link } from 'react-router-dom'; // Import useNavigate

const UserTable = ({ onAddStore }) => { // Accept onAddStore as a prop
  // --- State for data and UI ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- State for filters, sorting, pagination ---
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: '', // '' means no role filter
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Default sort
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10, // Default items per page
  });

  const navigate = useNavigate(); // Hook for navigation

  // --- Fetch users function ---
  const fetchUsers = async (filtersToUse = filters, sortToUse = sortConfig, pageToUse = pagination.currentPage, limitToUse = pagination.limit) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Add sorting
      params.append('sort', sortToUse.key);
      params.append('order', sortToUse.direction);

      // Add pagination
      params.append('page', pageToUse);
      params.append('limit', limitToUse);

      // Make API request
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination); // Update pagination info from backend

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users.');
      setUsers([]); // Clear users on error
      // Reset pagination on error to avoid stale data
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false,
        limit: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Effect to fetch users on initial load and when dependencies change ---
  useEffect(() => {
    fetchUsers();
  }, []); // Run once on mount

  // --- Handlers for UI interactions ---

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when filters change
    fetchUsers(filters, sortConfig, 1, pagination.limit);
  };

  const handleClearFilters = () => {
    setFilters({ name: '', email: '', address: '', role: '' });
    // Reset to page 1 and refetch
    fetchUsers({ name: '', email: '', address: '', role: '' }, sortConfig, 1, pagination.limit);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    // Reset to page 1 when sorting changes
    fetchUsers(filters, newSortConfig, 1, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchUsers(filters, sortConfig, newPage, pagination.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination(prev => ({ ...prev, limit: newLimit }));
    // Reset to page 1 when limit changes
    fetchUsers(filters, sortConfig, 1, newLimit);
  };

  // --- Handler for Add Store button ---
  const handleAddStoreClick = (userId) => {
    // Option 1: Use the prop callback (if parent wants to handle it)
    // if (onAddStore) {
    //   onAddStore(userId);
    // }

    // Option 2: Navigate directly (simpler for this case)
    navigate(`/admin/create/store/${userId}`);
  };

  // --- Helper function for sort indicator ---
  const getSortIndicator = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return null;
  };

  // --- Render Loading, Error, or Table ---
  if (loading && users.length === 0) {
    return <div className="p-4 text-center">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error: {error}</p>
        <button
          onClick={() => fetchUsers()}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
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
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="normal_user">Normal User</option>
            <option value="store_owner">Store Owner</option>
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
            Showing {users.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} users
          </div>
        </div>
      </div>

      {/* User Table */}
      {users.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No users found.</div>
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
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Role {getSortIndicator('role')}
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
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                {/* <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td> */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {/* This Link component needs to be imported */}
                    <Link to={`/admin/user/${user.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {user.name}
                    </Link>
                    </td>
                    {/* ... other cells ... */}
                   
                <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={user.address}>{user.address}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'normal_user' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.role.replace('_', ' ')} {/* Display 'store owner' nicely */}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()} {/* Format date */}
                </td>
                {/* Actions Column */}
                <td className="px-4 py-3 text-sm text-gray-500">
                  {user.role === 'store_owner' ? (
                    <button
                      onClick={() => handleAddStoreClick(user.id)} // Pass user ID
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Add Store
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span> // Or leave empty
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls (Bottom) */}
      {users.length > 0 && (
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

export default UserTable;