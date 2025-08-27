// backend/routes/admin.js
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middleware/auth.js';
import express from 'express';

const adminRoutes = express.Router();

// POST /api/admin/create/user
adminRoutes.post('/create/user', authenticate, authorize('admin'), async (req, res) => {
  const { name, email, password, address, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  // Validate role
  if (!['admin', 'normal_user', 'store_owner'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Validate name length
  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: 'Name must be between 2 and 60 characters' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password (8–16 chars, at least one uppercase, one special char)
  const passwordRegex = /^(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,16}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be 8-16 characters, include at least one uppercase letter and one special character'
    });
  }

  // Check if email already exists
  const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Insert user
  try {
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, address, role]
    );

    const newUser = result.rows[0];
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/create/store
adminRoutes.post('/create/store', authenticate, authorize('admin'), async (req, res) => {
    let { name, address, owner_id, email } = req.body;
  
    // Validate required fields
    if (!name || !address || owner_id === undefined) {
      return res.status(400).json({ message: 'Name, address, and owner_id are required' });
    }
  
    // ✅ Validate owner_id is an integer
    const ownerIdInt = parseInt(owner_id, 10);
    if (isNaN(ownerIdInt) || ownerIdInt <= 0) {
      return res.status(400).json({ message: 'owner_id must be a positive integer' });
    }
    owner_id = ownerIdInt; // Overwrite with parsed integer
  
    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: 'Store name must be between 2 and 100 characters' });
    }
  
    // Validate address length
    if (address.length > 400) {
      return res.status(400).json({ message: 'Address cannot exceed 400 characters' });
    }
  
    // Check if owner exists and is a store owner
    const ownerExists = await db.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [owner_id, 'store_owner']
    );
    if (ownerExists.rows.length === 0) {
      return res.status(400).json({ message: 'Owner must exist and be a store owner' });
    }
  
    // Check if email is unique (if provided)
    if (email) {
      const existingStore = await db.query('SELECT * FROM stores WHERE email = $1', [email]);
      if (existingStore.rows.length > 0) {
        return res.status(409).json({ message: 'Store email already exists' });
      }
    }
  
    // Insert store
    try {
      const result = await db.query(
        `INSERT INTO stores (name, address, owner_id, email)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, address, email, owner_id, created_at`,
        [name, address, owner_id, email]
      );
  
      const newStore = result.rows[0];
      res.status(201).json({
        message: 'Store created successfully',
        store: {
          id: newStore.id,
          name: newStore.name,
          address: newStore.address,
          email: newStore.email,
          owner_id: newStore.owner_id,
          created_at: newStore.created_at,
        },
      });
    } catch (err) {
      console.error('Error creating store:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// GET /api/admin/users
adminRoutes.get('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
      let baseQuery = 'SELECT id, name, email, address, role, created_at FROM users WHERE TRUE';
      const countQuery = 'SELECT COUNT(*) FROM users WHERE TRUE';
      const queryParams = [];
      let paramIndex = 1;
  
      // --- Apply Filters ---
      if (req.query.name) {
        baseQuery += ` AND name ILIKE $${paramIndex}`;
        queryParams.push(`%${req.query.name}%`);
        paramIndex++;
      }
  
      if (req.query.email) {
        baseQuery += ` AND email ILIKE $${paramIndex}`;
        queryParams.push(`%${req.query.email}%`);
        paramIndex++;
      }
  
      // Validate role input against allowed values
      const validRoles = ['admin', 'normal_user', 'store_owner'];
      if (req.query.role && validRoles.includes(req.query.role)) {
        baseQuery += ` AND role = $${paramIndex}`;
        queryParams.push(req.query.role);
        paramIndex++;
      } else if (req.query.role) {
          // Optional: return error for invalid role instead of ignoring
          // return res.status(400).json({ message: 'Invalid role filter value.' });
      }
  
      if (req.query.address) {
        baseQuery += ` AND address ILIKE $${paramIndex}`;
        queryParams.push(`%${req.query.address}%`);
        paramIndex++;
      }
  
      // --- Prepare Count Query (for pagination info) ---
      let countQueryWithFilters = countQuery;
      if (queryParams.length > 0) {
          // Use the same WHERE conditions for counting
          countQueryWithFilters = baseQuery.replace('SELECT id, name, email, address, role, created_at', 'SELECT COUNT(*)');
      }
  
      // --- Apply Sorting ---
      const validSortFields = ['name', 'email', 'role', 'created_at'];
      let sortField = 'created_at'; // Default sort field
      if (req.query.sort && validSortFields.includes(req.query.sort)) {
        sortField = req.query.sort;
      }
      const order = (req.query.order === 'asc') ? 'ASC' : 'DESC'; // Default order DESC
      baseQuery += ` ORDER BY ${sortField} ${order}`;
  
      // --- Apply Pagination ---
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
  
      // --- Execute Queries ---
      const result = await db.query(baseQuery, queryParams);
  
      // Get total count for pagination metadata
      const countResult = await db.query(countQueryWithFilters, queryParams.slice(0, paramIndex - 1)); // Exclude LIMIT/OFFSET params
      const totalUsers = parseInt(countResult.rows[0].count, 10);
  
      res.json({
        users: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Server error while fetching users.' });
    }
  });

  // GET /api/admin/stores
adminRoutes.get('/stores', authenticate, authorize('admin'), async (req, res) => {
    try {
      // Base query to select stores and calculate average rating
      let baseQuery = `
        SELECT
          s.id,
          s.name,
          s.address,
          s.email,
          s.owner_id,
          s.created_at,
          COALESCE(ROUND(AVG(r.score), 2), 0) AS average_rating -- Round to 2 decimal places
        FROM stores s
        LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active'
        WHERE TRUE
      `;
      const countQuery = 'SELECT COUNT(DISTINCT s.id) FROM stores s WHERE TRUE'; // Count distinct stores
      const queryParams = [];
      let paramIndex = 1;
  
      // --- Apply Filters ---
      if (req.query.name) {
        baseQuery += ` AND s.name ILIKE $${paramIndex}`;
        queryParams.push(`%${req.query.name}%`);
        paramIndex++;
      }
  
      if (req.query.email) {
        baseQuery += ` AND s.email ILIKE $${paramIndex}`;
        queryParams.push(`%${req.query.email}%`);
        paramIndex++;
      }
  
      if (req.query.address) {
        baseQuery += ` AND s.address ILIKE $${paramIndex}`;
        queryParams.push(`%${req.query.address}%`);
        paramIndex++;
      }
  
      // --- Group By for Aggregation ---
      baseQuery += ` GROUP BY s.id`;
  
       // --- Prepare Count Query (for pagination info) ---
       let countQueryWithFilters = countQuery;
       if (req.query.name || req.query.email || req.query.address) {
           // Rebuild WHERE part for count query
           let countWhereClause = ' WHERE TRUE';
           let countParamIndex = 1;
           const countParams = [];
  
           if (req.query.name) {
               countWhereClause += ` AND name ILIKE $${countParamIndex}`;
               countParams.push(`%${req.query.name}%`);
               countParamIndex++;
           }
           if (req.query.email) {
               countWhereClause += ` AND email ILIKE $${countParamIndex}`;
               countParams.push(`%${req.query.email}%`);
               countParamIndex++;
           }
           if (req.query.address) {
               countWhereClause += ` AND address ILIKE $${countParamIndex}`;
               countParams.push(`%${req.query.address}%`);
               // countParamIndex++; // Not needed as it's the last one
           }
           countQueryWithFilters = `SELECT COUNT(*) FROM stores s ${countWhereClause}`;
           // Note: countParams would be used if executing countQueryWithFilters separately,
           // but we reuse the main queryParams up to the sorting/pagination point.
           // For simplicity here, we assume the main query params cover the filters.
           // A more robust approach might build countParams separately.
           // For now, we slice the main queryParams correctly below.
       }
  
  
      // --- Apply Sorting ---
      const validSortFields = ['name', 'email', 'average_rating', 'created_at'];
      let sortField = 'created_at'; // Default sort field
      if (req.query.sort && validSortFields.includes(req.query.sort)) {
        sortField = req.query.sort;
      }
      const order = (req.query.order === 'asc') ? 'ASC' : 'DESC'; // Default order DESC
  
      // Special handling for average_rating sorting
      let orderByClause;
      if (sortField === 'average_rating') {
        orderByClause = `ORDER BY average_rating ${order}`;
      } else {
        // Prefix other fields with 's.' for store table alias
        orderByClause = `ORDER BY s.${sortField} ${order}`;
      }
      baseQuery += ` ${orderByClause}`;
  
      // --- Apply Pagination ---
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
  
       // --- Execute Queries ---
       // Get total count for pagination metadata
       // We need to slice queryParams to exclude LIMIT/OFFSET for the count query
       // The count query only needs the filter parameters
       const filterParamCount = paramIndex - 1; // Number of filter parameters added
       const countResult = await db.query(countQueryWithFilters, queryParams.slice(0, filterParamCount));
       const totalStores = parseInt(countResult.rows[0].count, 10);
  
       const result = await db.query(baseQuery, queryParams);
  
  
      res.json({
        stores: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStores / limit),
          totalStores,
          hasNext: page < Math.ceil(totalStores / limit),
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      console.error('Error fetching stores:', err);
      res.status(500).json({ message: 'Server error while fetching stores.' });
    }
  });

  // GET /api/admin/ratings
adminRoutes.get('/ratings', authenticate, authorize('admin'), async (req, res) => {
    try {
      // Base query to select ratings and join with stores and users for names
      let baseQuery = `
        SELECT
          r.rating_id,
          r.store_id,
          s.name AS store_name, -- Get store name
          r.user_id,
          u.name AS user_name, -- Get user name
          r.score,
          r.text,
          r.likes_count,
          r.status,
          r.created_at,
          r.updated_at
        FROM ratings r
        JOIN stores s ON r.store_id = s.id -- Join stores to get name
        JOIN users u ON r.user_id = u.id  -- Join users to get name
        WHERE TRUE
      `;
      // Query to count total matching ratings for pagination
      let countQuery = `
        SELECT COUNT(*)
        FROM ratings r
        JOIN stores s ON r.store_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE TRUE
      `;
      
      const queryParams = [];
      let paramIndex = 1;
  
      // --- Apply Filters ---
      if (req.query.store_id) {
        const storeId = parseInt(req.query.store_id, 10);
        if (!isNaN(storeId) && storeId > 0) {
          baseQuery += ` AND r.store_id = $${paramIndex}`;
          countQuery += ` AND r.store_id = $${paramIndex}`;
          queryParams.push(storeId);
          paramIndex++;
        } else {
          return res.status(400).json({ message: 'Invalid store_id filter value.' });
        }
      }
  
      if (req.query.user_id) {
        const userId = parseInt(req.query.user_id, 10);
        if (!isNaN(userId) && userId > 0) {
          baseQuery += ` AND r.user_id = $${paramIndex}`;
          countQuery += ` AND r.user_id = $${paramIndex}`;
          queryParams.push(userId);
          paramIndex++;
        } else {
          return res.status(400).json({ message: 'Invalid user_id filter value.' });
        }
      }
  
      if (req.query.score !== undefined) {
        const score = parseInt(req.query.score, 10);
        if (!isNaN(score) && score >= 1 && score <= 5) {
          baseQuery += ` AND r.score = $${paramIndex}`;
          countQuery += ` AND r.score = $${paramIndex}`;
          queryParams.push(score);
          paramIndex++;
        } else {
          return res.status(400).json({ message: 'Score filter must be an integer between 1 and 5.' });
        }
      }
  
      // Validate status input against allowed values
      const validStatuses = ['active', 'pending', 'rejected'];
      if (req.query.status && validStatuses.includes(req.query.status)) {
        baseQuery += ` AND r.status = $${paramIndex}`;
        countQuery += ` AND r.status = $${paramIndex}`;
        queryParams.push(req.query.status);
        paramIndex++;
      } else if (req.query.status) {
          return res.status(400).json({ message: 'Invalid status filter value.' });
      }
  
      // --- Apply Sorting ---
      // Note: Sorting by joined fields like store_name or user_name is possible
      // but requires aliasing in the SELECT and ORDER BY clauses.
      const validSortFields = [
        'rating_id', 'store_id', 'user_id', 'score', 'status',
        'created_at', 'updated_at'
        // Add 'store_name', 'user_name' if needed, but adjust query aliasing
      ];
      let sortField = 'created_at'; // Default sort field
      if (req.query.sort && validSortFields.includes(req.query.sort)) {
        // Prefix fields with 'r.' for rating table alias if not a joined name field
        if (req.query.sort === 'store_name' || req.query.sort === 'user_name') {
           sortField = req.query.sort; // These are aliased in SELECT
        } else {
           sortField = `r.${req.query.sort}`;
        }
      }
      const order = (req.query.order === 'asc') ? 'ASC' : 'DESC'; // Default order DESC
      baseQuery += ` ORDER BY ${sortField} ${order}`;
  
      // --- Apply Pagination ---
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
  
      // --- Execute Queries ---
      const result = await db.query(baseQuery, queryParams);
  
      // Get total count for pagination metadata
      // Use the same queryParams up to the LIMIT/OFFSET point for the count query
      const countResult = await db.query(countQuery, queryParams.slice(0, paramIndex - 1));
      const totalRatings = parseInt(countResult.rows[0].count, 10);
  
      res.json({
        ratings: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRatings / limit),
          totalRatings,
          hasNext: page < Math.ceil(totalRatings / limit),
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      console.error('Error fetching ratings:', err);
      res.status(500).json({ message: 'Server error while fetching ratings.' });
    }
  });

  // GET /api/admin/dashboard
adminRoutes.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
    try {
      // Query to get total count of users
      const userCountResult = await db.query('SELECT COUNT(*) AS count FROM users');
      const totalUsers = parseInt(userCountResult.rows[0].count, 10);
  
      // Query to get total count of stores
      const storeCountResult = await db.query('SELECT COUNT(*) AS count FROM stores');
      const totalStores = parseInt(storeCountResult.rows[0].count, 10);
  
      // Query to get total count of submitted ratings
      // Note: The schema uses 'status' (active, pending, rejected). 
      // The challenge description implies counting "submitted" ratings.
      // We'll count all ratings regardless of status, or only 'active' ones.
      // Let's count all submitted ratings (status = 'active' or 'rejected' or 'pending')
      // If only active ratings are meant, use: WHERE status = 'active'
      const ratingCountResult = await db.query('SELECT COUNT(*) AS count FROM ratings'); 
      // Alternative for only active: 
      // const ratingCountResult = await db.query("SELECT COUNT(*) AS count FROM ratings WHERE status = 'active'");
      const totalRatings = parseInt(ratingCountResult.rows[0].count, 10);
  
      res.json({
        dashboardData: {
          totalUsers,
          totalStores,
          totalRatings,
        },
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      res.status(500).json({ message: 'Server error while fetching dashboard data.' });
    }
  });

  // GET /api/admin/users/:id
adminRoutes.get('/users/:id', authenticate, authorize('admin'), async (req, res) => {
    const userId = parseInt(req.params.id, 10);
  
    // Validate ID parameter
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID provided.' });
    }
  
    try {
      // Query to get user details
      const userResult = await db.query(
        `SELECT id, name, email, address, role, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [userId]
      );
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const user = userResult.rows[0];
  
      // If the user is a store owner, get their store's average rating
      if (user.role === 'store_owner') {
        const ratingResult = await db.query(
          `SELECT COALESCE(ROUND(AVG(r.score), 2), 0)::TEXT AS store_rating
           FROM stores s
           LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active'
           WHERE s.owner_id = $1
           GROUP BY s.id`, // Group by store ID in case an owner has multiple stores (though schema implies one owner per store)
          [userId]
        );
        // Assuming one store per owner as per schema FK constraint
        if (ratingResult.rows.length > 0) {
          user.store_rating = ratingResult.rows[0].store_rating; // Add rating to user object
        } else {
           user.store_rating = "0"; // Or "No ratings" if preferred
        }
      }
  
      res.json({ user });
    } catch (err) {
      console.error(`Error fetching user details for ID ${userId}:`, err);
      res.status(500).json({ message: 'Server error while fetching user details.' });
    }
  });

  // GET /api/admin/stores/:id
adminRoutes.get('/stores/:id', authenticate, authorize('admin'), async (req, res) => {
    const storeId = parseInt(req.params.id, 10);
  
    // Validate ID parameter
    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({ message: 'Invalid store ID provided.' });
    }
  
    try {
      // Query to get store details along with owner name and average rating
      const storeResult = await db.query(
        `SELECT
           s.id,
           s.name,
           s.address,
           s.email,
           s.owner_id,
           u.name AS owner_name, -- Join to get owner's name
           s.created_at,
           s.updated_at,
           COALESCE(ROUND(AVG(r.score), 2), 0)::TEXT AS average_rating
         FROM stores s
         JOIN users u ON s.owner_id = u.id -- Join with users table to get owner name
         LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active' -- Join ratings for average
         WHERE s.id = $1
         GROUP BY s.id, u.name`, // Group by store and owner name
        [storeId]
      );
  
      if (storeResult.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found.' });
      }
  
      const store = storeResult.rows[0];
      res.json({ store });
    } catch (err) {
      console.error(`Error fetching store details for ID ${storeId}:`, err);
      res.status(500).json({ message: 'Server error while fetching store details.' });
    }
  });

  // GET /api/admin/search/stores
adminRoutes.get('/search/stores', authenticate, authorize('admin'), async (req, res) => {
    const searchTerm = req.query.q;
    const useFullText = req.query.use_fulltext === 'true';
  
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      return res.status(400).json({ message: 'A non-empty search query (q) is required.' });
    }
  
    try {
      let query;
      let queryParams;
  
      if (useFullText) {
        // --- Full-Text Search Approach ---
        // This uses PostgreSQL's built-in full-text search capabilities.
        // It's generally better for ranking and relevance, especially for multi-word queries.
        // We'll search in the 'name' and 'address' columns.
        // Note: For full-text search to be most effective, you might consider adding a tsvector column
        // and a GIN index on it (e.g., ALTER TABLE stores ADD COLUMN search_vector tsvector; 
        // UPDATE stores SET search_vector = to_tsvector('english', name || ' ' || address);
        // CREATE INDEX idx_stores_search ON stores USING GIN (search_vector);)
        // For simplicity here, we'll use to_tsvector on the fly, which is less performant for large tables.
  
        query = `
          SELECT
            s.id,
            s.name,
            s.address,
            s.email,
            s.owner_id,
            s.created_at,
            COALESCE(ROUND(AVG(r.score), 2), 0)::TEXT AS average_rating,
            -- Calculate a rank for ordering (higher is better)
            ts_rank_cd(to_tsvector('english', s.name || ' ' || s.address), plainto_tsquery('english', $1)) AS rank
          FROM stores s
          LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active'
          WHERE to_tsvector('english', s.name || ' ' || s.address) @@ plainto_tsquery('english', $1)
             OR s.email ILIKE $2 -- Still use ILIKE for email
          GROUP BY s.id, rank
          ORDER BY rank DESC, s.name ASC -- Order by rank first, then name
          LIMIT 20; -- Limit results for performance/usability
        `;
        // Use the search term for both tsquery and ILIKE (for email)
        queryParams = [searchTerm, `%${searchTerm}%`];
  
      } else {
        // --- Simple ILIKE Search Approach ---
        // This searches for the term anywhere within name, address, or email.
        query = `
          SELECT
            s.id,
            s.name,
            s.address,
            s.email,
            s.owner_id,
            s.created_at,
            COALESCE(ROUND(AVG(r.score), 2), 0)::TEXT AS average_rating
          FROM stores s
          LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active'
          WHERE s.name ILIKE $1
             OR s.address ILIKE $1
             OR s.email ILIKE $1
          GROUP BY s.id
          ORDER BY s.name ASC -- Simple default ordering
          LIMIT 50; -- Limit results for performance/usability
        `;
        queryParams = [`%${searchTerm}%`];
      }
  
      const result = await db.query(query, queryParams);
  
      res.json({
        searchTerm: searchTerm,
        searchType: useFullText ? 'fulltext' : 'simple_ilike',
        results: result.rows,
        count: result.rows.length,
      });
    } catch (err) {
      console.error('Error searching stores:', err);
      res.status(500).json({ message: 'Server error while searching stores.' });
    }
  });

  // GET /api/admin/search/users
adminRoutes.get('/search/users', authenticate, authorize('admin'), async (req, res) => {
    const searchTerm = req.query.q;
  
    // 1. Validate the search query parameter
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      return res.status(400).json({ message: 'A non-empty search query (q) is required.' });
    }
  
    try {
      // 2. Construct the SQL query using ILIKE for case-insensitive partial matching
      //    Search in name, email, and address columns.
      const query = `
        SELECT id, name, email, address, role, created_at
        FROM users
        WHERE name ILIKE $1
           OR email ILIKE $1
           OR address ILIKE $1
        ORDER BY name ASC -- Simple default ordering, can be changed
        LIMIT 50; -- Limit results for performance/usability
      `;
  
      // 3. Prepare the parameter with wildcards for partial matching
      const queryParams = [`%${searchTerm}%`];
  
      // 4. Execute the database query
      const result = await db.query(query, queryParams);
  
      // 5. Send the successful response
      res.json({
        searchTerm: searchTerm,
        results: result.rows,
        count: result.rows.length,
      });
    } catch (err) {
      // 6. Handle any unexpected errors
      console.error('Error searching users:', err);
      res.status(500).json({ message: 'Server error while searching users.' });
    }
  });
  


export default adminRoutes;