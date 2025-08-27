// backend/routes/user.js
import express from 'express';
import { db } from '../config/db.js'; // Import your database pool
import { authenticate , authorize} from '../middleware/auth.js'; // Import your auth middleware

const userRouter = express.Router();


// GET /api/user/stores
userRouter.get('/stores', authenticate, async (req, res) => {
    try {
        const userId = req.user.id; // Get authenticated user's ID

        // Base query to select stores, calculate average rating, and get user's rating
        // Using a subquery to fetch the user's specific rating for each store
        let baseQuery = `
            SELECT
                s.id,
                s.name,
                s.address,
                s.created_at,
                COALESCE(ROUND(AVG(r.score), 2), 0) AS average_rating,
                (SELECT score FROM ratings ur WHERE ur.store_id = s.id AND ur.user_id = $1 AND ur.status = 'active') AS user_rating
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active'
            WHERE TRUE
        `;
        // Count query for pagination metadata (also needs user ID for potential future filters involving user)
        const countQuery = 'SELECT COUNT(DISTINCT s.id) FROM stores s WHERE TRUE';

        const queryParams = [userId]; // Start with user ID for the subquery
        let paramIndex = 2; // Next parameter index for filters

        // --- Apply Filters (Name, Address) ---
        if (req.query.name) {
            baseQuery += ` AND s.name ILIKE $${paramIndex}`;
            queryParams.push(`%${req.query.name}%`);
            paramIndex++;
        }

        if (req.query.address) {
            baseQuery += ` AND s.address ILIKE $${paramIndex}`;
            queryParams.push(`%${req.query.address}%`);
            paramIndex++;
        }

        // --- Group By for Aggregation (average_rating) ---
        baseQuery += ` GROUP BY s.id`;

        // --- Prepare Count Query with Filters ---
        let countQueryWithFilters = countQuery;
        if (req.query.name || req.query.address) {
            let countWhereClause = ' WHERE TRUE';
            let countParamIndex = 1; // Reset for count query params slice
            const countParams = [];

            if (req.query.name) {
                countWhereClause += ` AND name ILIKE $${countParamIndex}`;
                countParams.push(`%${req.query.name}%`);
                countParamIndex++;
            }
            if (req.query.address) {
                countWhereClause += ` AND address ILIKE $${countParamIndex}`;
                countParams.push(`%${req.query.address}%`);
                // countParamIndex++; // Not strictly needed here
            }
            countQueryWithFilters = `SELECT COUNT(*) FROM stores s ${countWhereClause}`;
            // For executing count, we need only the filter params
            // We'll slice the main queryParams later to get only the filter parts for count
        }


        // --- Apply Sorting ---
        const validSortFields = ['name', 'address', 'average_rating', 'created_at'];
        let sortField = 'created_at'; // Default sort field
        if (req.query.sort && validSortFields.includes(req.query.sort)) {
            sortField = req.query.sort;
        }
        const order = (req.query.order === 'asc') ? 'ASC' : 'DESC'; // Default order DESC

        // Special handling for average_rating sorting (it's an alias)
        let orderByClause;
        if (sortField === 'average_rating') {
            orderByClause = `ORDER BY average_rating ${order}`;
        } else {
            // Prefix other fields with 's.' for store table alias
             // Note: user_rating is not typically sorted by, but if needed, handle similarly or exclude
            orderByClause = `ORDER BY s.${sortField} ${order}`;
        }
        baseQuery += ` ${orderByClause}`;


        // --- Apply Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset); // Add limit and offset to params

        // --- Execute Queries ---
        // Get total count for pagination metadata
        // Slice queryParams to get only the parts relevant for the count query (filters)
        // User ID ($1) is not used in the count WHERE clause directly, only in the main query's subquery
        // So we slice from index 1 (after userId) up to where limit/offset start
        const filterParamCount = paramIndex - 1; // Index where LIMIT/OFFSET params start
        // We need the params for filters only: [userId, filter1, filter2, ...]
        // So slice from index 1 to filterParamCount (which is the index of LIMIT)
        const countParamsForQuery = queryParams.slice(1, filterParamCount); // Exclude userId and limit/offset
        const countResult = await db.query(countQueryWithFilters, countParamsForQuery);
        const totalStores = parseInt(countResult.rows[0].count, 10);

        const result = await db.query(baseQuery, queryParams); // Execute main query


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
        console.error('Error fetching stores for user:', err);
        res.status(500).json({ message: 'Server error while fetching stores.' });
    }
});

  // GET /api/admin/stores/:id
userRouter.get('/stores/:id', authenticate,  async (req, res) => {
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
userRouter.get('/search/stores', authenticate, async (req, res) => {
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

  // GET /api/user/ratings
userRouter.get('/ratings', authenticate, async (req, res) => {
    try {
        const userId = req.user.id; // Get authenticated user's ID

        // Base query to select user's ratings and join with store name
        let baseQuery = `
            SELECT
                r.rating_id,
                r.store_id,
                s.name AS store_name, -- Get store name
                r.score,
                r.text,
                r.created_at,
                r.updated_at
            FROM ratings r
            JOIN stores s ON r.store_id = s.id -- Join to get store name
            WHERE r.user_id = $1 -- Filter by current user
              AND r.status = 'active' -- Only fetch active ratings
        `;
        // Count query for pagination metadata
        const countQuery = `SELECT COUNT(*) FROM ratings r WHERE r.user_id = $1 AND r.status = 'active'`;

        const queryParams = [userId]; // Start with user ID
        let paramIndex = 2; // Next parameter index for sorting/pagination

        // --- Apply Sorting ---
        // Define valid sort fields based on the joined data
        const validSortFields = ['store_name', 'score', 'created_at'];
        let sortField = 'created_at'; // Default sort field
        if (req.query.sort && validSortFields.includes(req.query.sort)) {
            sortField = req.query.sort;
        }
        const order = (req.query.order === 'asc') ? 'ASC' : 'DESC'; // Default order DESC

        // Special handling for aliases or joined fields if needed (not strictly necessary here as aliases match)
        let orderByClause;
        if (sortField === 'store_name') {
            // Sort by the alias 'store_name'
            orderByClause = `ORDER BY store_name ${order}`;
        } else if (sortField === 'score' || sortField === 'created_at' || sortField === 'updated_at') {
             // Sort by fields directly available in the ratings table (aliased or not)
             orderByClause = `ORDER BY r.${sortField} ${order}`;
        } else {
             // Default fallback sort
             orderByClause = `ORDER BY r.created_at DESC`;
        }
        baseQuery += ` ${orderByClause}`;


        // --- Apply Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset); // Add limit and offset to params

        // --- Execute Queries ---
        // Get total count for pagination metadata
        const countResult = await db.query(countQuery, [userId]); // Count query only needs user ID
        const totalRatings = parseInt(countResult.rows[0].count, 10);

        const result = await db.query(baseQuery, queryParams); // Execute main query


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
        console.error('Error fetching user ratings:', err);
        res.status(500).json({ message: 'Server error while fetching ratings.' });
    }
});

// POST /api/user/rate/:store_id
userRouter.post('/rate/:store_id', authenticate, async (req, res) => {
    const userId = req.user.id; // Get authenticated user's ID
    const storeId = parseInt(req.params.store_id, 10); // Get store ID from path parameter
    const { score, text } = req.body;

    // 1. Validate Path Parameter (store_id)
    if (isNaN(storeId) || storeId <= 0) {
        return res.status(400).json({ message: 'Invalid store ID provided.' });
    }

    // 2. Validate Request Body
    // Check if score is provided and is a valid integer between 1 and 5
    if (score === undefined || score === null || !Number.isInteger(score) || score < 1 || score > 5) {
        return res.status(400).json({ message: 'Score is required and must be an integer between 1 and 5.' });
    }

    // Handle text: ensure it's a string, default to empty string if not provided or null/undefined
    let ratingText = "";
    if (text !== undefined && text !== null) {
        if (typeof text !== 'string') {
            return res.status(400).json({ message: 'Text must be a string.' });
        }
        ratingText = text;
    }
    // If text is undefined or null, ratingText remains ""

    try {
        // 3. Check if the Store Exists
        const storeExistsResult = await db.query('SELECT id FROM stores WHERE id = $1', [storeId]);
        if (storeExistsResult.rows.length === 0) {
            return res.status(404).json({ message: 'Store not found.' });
        }

        // 4. Insert the New Rating
        // The UNIQUE (store_id, user_id) constraint will prevent duplicates
        // The status defaults to 'active' as per the table definition
        // likes_count defaults to 0
        // text defaults to the processed ratingText (which could be "")
        const insertResult = await db.query(
            `INSERT INTO ratings (store_id, user_id, score, text)
             VALUES ($1, $2, $3, $4)
             RETURNING rating_id, store_id, user_id, score, text, likes_count, status, created_at, updated_at`,
            [storeId, userId, score, ratingText] // Pass the potentially empty string for text
        );

        const newRating = insertResult.rows[0];

        // 5. Respond with Success
        res.status(201).json({ message: 'Rating submitted successfully.', rating: newRating });

    } catch (error) {
        console.error('Error submitting rating:', error);

        // 6. Handle Specific Database Errors
        // Check for unique constraint violation (user already rated this store)
        if (error.code === '23505') { // Unique violation error code in PostgreSQL
            return res.status(409).json({ message: 'You have already submitted a rating for this store.' });
        }

        // 7. Generic Server Error
        res.status(500).json({ message: 'Internal server error while submitting rating.' });
    }
});

// PUT /api/user/edit/rating/:rating_id
userRouter.put('/edit/rating/:rating_id', authenticate, async (req, res) => {
    const userId = req.user.id; // Get authenticated user's ID
    const ratingId = parseInt(req.params.rating_id, 10); // Get rating ID from path parameter
    const { score, text } = req.body;

    // 1. Validate Path Parameter (rating_id)
    if (isNaN(ratingId) || ratingId <= 0) {
        return res.status(400).json({ message: 'Invalid rating ID provided.' });
    }

    // 2. Validate Request Body (only if fields are present)
    // Prepare update data object
    const updateData = {};
    if (score !== undefined) { // Allow setting score to 0/null if that's a valid use case, but not undefined
        if (score === null || !Number.isInteger(score) || score < 1 || score > 5) {
            return res.status(400).json({ message: 'Score must be an integer between 1 and 5.' });
        }
        updateData.score = score;
    }

    if (text !== undefined) { // Allow setting text to "" or null explicitly
         if (text !== null && typeof text !== 'string') {
             return res.status(400).json({ message: 'Text must be a string or null.' });
         }
         // Handle empty string or null correctly
         updateData.text = text; // This allows setting text to "" or NULL in the DB
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
         return res.status(400).json({ message: 'At least one field (score or text) must be provided for update.' });
    }

    try {
        // 3. Check if the Rating Exists and Belongs to the User AND is editable (e.g., active)
        const ratingCheckResult = await db.query(
            `SELECT rating_id, user_id, status FROM ratings WHERE rating_id = $1`,
            [ratingId]
        );

        if (ratingCheckResult.rows.length === 0) {
            return res.status(404).json({ message: 'Rating not found.' });
        }

        const rating = ratingCheckResult.rows[0];

        // Check Ownership
        if (rating.user_id !== userId) {
            // Option 1: Return 403 Forbidden (explicitly denied)
            // return res.status(403).json({ message: 'Access denied. You cannot edit this rating.' });
            // Option 2: Return 404 Not Found (hides existence/info) - Often preferred for security
            return res.status(404).json({ message: 'Rating not found.' });
        }

        // Check Status (Optional: prevent editing non-active ratings)
        // PDF doesn't specify, assuming active ratings are editable.
        // You can uncomment and adjust logic if needed.
        // if (rating.status !== 'active') {
        //     return res.status(409).json({ message: `Cannot edit rating with status '${rating.status}'.` });
        // }

        // 4. Build Dynamic Update Query
        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updateData)) {
            setClauses.push(`${key} = $${paramIndex}`);
            queryParams.push(value);
            paramIndex++;
        }
        // Always update the updated_at timestamp (trigger handles it, but explicit is fine)
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        // Add ratingId for WHERE clause
        queryParams.push(ratingId);

        const updateQuery = `
            UPDATE ratings
            SET ${setClauses.join(', ')}
            WHERE rating_id = $${paramIndex}
            RETURNING rating_id, store_id, user_id, score, text, likes_count, status, created_at, updated_at
        `;

        // 5. Execute the Update Query
        const updateResult = await db.query(updateQuery, queryParams);
        const updatedRating = updateResult.rows[0]; // Should always be one row due to WHERE rating_id

        // 6. Respond with Success
        res.status(200).json({ message: 'Rating updated successfully.', rating: updatedRating });

    } catch (error) {
        console.error('Error updating rating:', error);
        // 7. Generic Server Error
        res.status(500).json({ message: 'Internal server error while updating rating.' });
    }
});


export default router;