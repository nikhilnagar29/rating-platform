// backend/routes/user.js
import express from 'express';
import { db } from '../config/db.js'; // Import your database pool
import { authenticate , authorize } from '../middleware/auth.js'; // Import your auth middleware

const owenerRouter = express.Router();

// POST /api/admin/create/store (or maybe /api/store-owner/create/store)

owenerRouter.post('/create/store', authenticate, authorize('store_owner'), async (req, res) => {
    let { name, address, email } = req.body;
  
    // 1. Validate required fields (Corrected logic)
    if (!name || !address) { // name and address are required and must be truthy
      return res.status(400).json({ message: 'Name and address are required' });
    }
  
    // 2. Get owner_id from the authenticated user (Corrected access)
    const owner_id = req.user.id; // req.user, not res.user. Use const.

    // --- Optional: Check if Store Already Exists for this Owner ---
    // Depending on business rules, you might want only ONE store per owner.
    // Uncomment the block below if that's the case:
    /*
    const existingStoreForOwner = await db.query(
        'SELECT id FROM stores WHERE owner_id = $1',
        [owner_id]
    );
    if (existingStoreForOwner.rows.length > 0) {
        return res.status(409).json({ message: 'You have already created a store.' });
    }
    */
    // --- End Optional Check ---
  
    // 3. Validate name length (Assuming Min 2 from schema, PDF text might be typo)
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: 'Store name must be between 2 and 100 characters' });
    }
  
    // 4. Validate address length
    if (address.length > 400) {
      return res.status(400).json({ message: 'Address cannot exceed 400 characters' });
    }
  
    // 5. Check if owner exists and is a store owner (Slightly redundant but safe)
    // Since authorize('store_owner') ran, req.user.role should be 'store_owner'
    const ownerExists = await db.query(
      'SELECT 1 FROM users WHERE id = $1 AND role = $2', // SELECT 1 is efficient
      [owner_id, 'store_owner']
    );
    if (ownerExists.rows.length === 0) {
      // This case should ideally not happen if authz is working, but good check
      return res.status(400).json({ message: 'Owner must exist and be a store owner' });
    }
  
    // 6. Check if email is unique (if provided)
    if (email) {
        // Basic email format validation (consider using 'validator' package for robustness)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
             return res.status(400).json({ message: 'Invalid email format.' });
        }

        const existingStore = await db.query('SELECT 1 FROM stores WHERE email = $1', [email]);
        if (existingStore.rows.length > 0) {
            return res.status(409).json({ message: 'Store email already exists' });
        }
    }
  
    // 7. Insert store
    try {
        const result = await db.query(
            `INSERT INTO stores (name, address, owner_id, email)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, address, email, owner_id, created_at`,
            [name, address, owner_id, email || null] // Handle email correctly if undefined
        );

        const newStore = result.rows[0];
        res.status(201).json({
            message: 'Store created successfully',
            store: newStore // Returning the whole object is fine
        });
    } catch (err) {
        console.error('Error creating store:', err);
        
        // Handle specific database errors (e.g., unique constraint if not caught above)
        if (err.code === '23505') { // Unique violation
             // Determine which unique constraint failed (email or potentially owner_id if unique per owner)
             // This specific error might come from email if validation missed it or concurrency
             return res.status(409).json({ message: 'Store creation failed due to a conflict (e.g., email might already exist).' });
        }
        
        res.status(500).json({ message: 'Server error while creating store.' });
    }
});

// GET /api/owner/stores
owenerRouter.get('/stores', authenticate, authorize('store_owner'), async (req, res) => {
    try {
        const ownerId = req.user.id; // Get authenticated store owner's ID

        // 1. Query to get stores with average rating and total count
        const storesQuery = `
            SELECT
                s.id,
                s.name,
                s.address,
                s.email,
                s.created_at,
                COALESCE(ROUND(AVG(r.score), 2), 0) AS average_rating,
                COUNT(r.rating_id) AS total_ratings_count -- Count active ratings
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id AND r.status = 'active'
            WHERE s.owner_id = $1
            GROUP BY s.id
            ORDER BY s.created_at DESC;
        `;

        const storesResult = await db.query(storesQuery, [ownerId]);
        const stores = storesResult.rows;

        // 2. If no stores found, return empty list
        if (stores.length === 0) {
            return res.json({ stores: [] });
        }

        // 3. Fetch recent ratings for each store
        // We'll fetch the most recent 5 ratings per store
        const storeIds = stores.map(store => store.id);
        // Create placeholders for the IN clause: ($1, $2, $3, ...)
        const placeholders = storeIds.map((_, index) => `$${index + 1}`).join(', ');
        const ratingsQuery = `
            SELECT
                r.rating_id,
                r.store_id,
                r.score,
                r.text,
                r.created_at AS rating_created_at,
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.store_id = ANY($${storeIds.length + 1}) -- Use ANY with array
              AND r.status = 'active'
            ORDER BY r.created_at DESC
        `;

        // Execute ratings query for all relevant store IDs
        const ratingsResult = await db.query(ratingsQuery, [...storeIds]); // Spread storeIds into params
        const allRatings = ratingsResult.rows;

        // 4. Group ratings by store_id for easier assignment
        const ratingsByStoreId = {};
        allRatings.forEach(rating => {
             if (!ratingsByStoreId[rating.store_id]) {
                 ratingsByStoreId[rating.store_id] = [];
             }
             // Limit to last 5 ratings per store directly during assignment if needed,
             // but simpler to limit total fetched or limit here.
             // Let's limit here to last 5 per store.
             if(ratingsByStoreId[rating.store_id].length < 5) {
                  ratingsByStoreId[rating.store_id].push(rating);
             }
        });

        // 5. Combine store data with its ratings
        const storesWithDetails = stores.map(store => ({
            ...store,
            recent_ratings: ratingsByStoreId[store.id] || [] // Attach recent ratings or empty array
        }));

        res.json({
            stores: storesWithDetails
        });
    } catch (err) {
        console.error('Error fetching detailed owner stores:', err);
        res.status(500).json({ message: 'Server error while fetching store details.' });
    }
});

// GET /api/owner/store/:store_id
owenerRouter.get('/store/:store_id', authenticate, authorize('store_owner'), async (req, res) => {
    const ownerId = req.user.id; // Get authenticated store owner's ID
    const storeId = parseInt(req.params.store_id, 10); // Get store ID from path parameter

    // 1. Validate Path Parameter (store_id)
    if (isNaN(storeId) || storeId <= 0) {
        return res.status(400).json({ message: 'Invalid store ID provided.' });
    }

    try {
        // 2. Check if the Store Exists AND belongs to the authenticated owner
        const ownershipCheckResult = await db.query(
            `SELECT id, name, address, email, created_at
             FROM stores
             WHERE id = $1 AND owner_id = $2`,
            [storeId, ownerId]
        );

        if (ownershipCheckResult.rows.length === 0) {
             // Store doesn't exist OR doesn't belong to this owner.
             // Return 404 for security (hides existence/info)
            return res.status(404).json({ message: 'Store not found.' });
        }

        const store = ownershipCheckResult.rows[0]; // Basic store details

        // 3. Fetch Store Metrics (Average Rating and Total Count)
        const metricsResult = await db.query(
            `SELECT
                COALESCE(ROUND(AVG(r.score), 2), 0) AS average_rating,
                COUNT(r.rating_id) AS total_ratings_count
             FROM ratings r
             WHERE r.store_id = $1 AND r.status = 'active'`,
            [storeId]
        );
        const metrics = metricsResult.rows[0]; // Should always be one row

        // 4. Fetch All Active Ratings for this Store with User Details
        // Consider adding pagination if stores can have many ratings
        // For now, fetching all, ordered by creation date (newest first)
        const sort = req.query.sort || 'created_at'; // Default sort field
        const order = (req.query.order === 'asc') ? 'ASC' : 'DESC'; // Default DESC

        // Validate sort field to prevent SQL injection in ORDER BY (basic check)
        const validSortFields = ['created_at', 'score', 'user_name']; // Add more if needed
        let orderByClause = "ORDER BY r.created_at DESC"; // Default
        if (validSortFields.includes(sort)) {
            if (sort === 'user_name') {
                orderByClause = `ORDER BY u.name ${order}`; // Sort by user name from joined table
            } else {
                orderByClause = `ORDER BY r.${sort} ${order}`; // Sort by rating fields
            }
        } // If invalid sort, default order is used

        const ratingsQuery = `
            SELECT
                r.rating_id,
                r.score,
                r.text,
                r.created_at AS rating_created_at,
                u.name AS user_name,
                u.email AS user_email
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.store_id = $1 AND r.status = 'active'
            ${orderByClause}
        `;

        const ratingsResult = await db.query(ratingsQuery, [storeId]);
        const ratings = ratingsResult.rows;


        // 5. Assemble and Send Response
        res.json({
            store: store,
            metrics: metrics,
            ratings: ratings
        });

    } catch (err) {
        console.error('Error fetching owner store details:', err);
        res.status(500).json({ message: 'Server error while fetching store details.' });
    }
});

export default owenerRouter;
