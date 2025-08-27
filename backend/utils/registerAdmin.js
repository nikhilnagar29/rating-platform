// backend/utils/seedDemoData.js
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = 'Abcd@1234';
const HASH_ROUNDS = 10;

// --- Helper Functions ---

/**
 * Checks if a user with the given email already exists.
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
async function userExists(email) {
    try {
        const result = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
        return result.rows.length > 0;
    } catch (err) {
        console.error(`Error checking if user ${email} exists:`, err.message);
        // If there's an error, assume user doesn't exist to prevent unintended overwrites
        return false;
    }
}

/**
 * Creates a new user.
 * @param {string} name - User's name.
 * @param {string} email - User's email.
 * @param {string} role - User's role ('admin', 'normal_user', 'store_owner').
 * @param {string} address - User's address.
 * @returns {Promise<number|null>} The new user's ID, or null on failure.
 */
async function createUser(name, email, role, address) {
    try {
        const salt = await bcrypt.genSalt(HASH_ROUNDS);
        const password_hash = await bcrypt.hash(DEMO_PASSWORD, salt);

        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, address, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [name, email, password_hash, address, role]
        );
        console.log(`✅ User created: ${name} (${email}, ${role})`);
        return result.rows[0].id;
    } catch (err) {
        console.error(`❌ Error creating user ${name} (${email}):`, err.message);
        return null;
    }
}

/**
 * Checks if a store with the given name already exists.
 * @param {string} name - The store name to check.
 * @returns {Promise<boolean>} True if the store exists, false otherwise.
 */
async function storeExists(name) {
    try {
        const result = await db.query('SELECT 1 FROM stores WHERE name = $1', [name]);
        return result.rows.length > 0;
    } catch (err) {
        console.error(`Error checking if store ${name} exists:`, err.message);
        return false;
    }
}

/**
 * Creates a new store.
 * @param {string} name - Store name.
 * @param {string} address - Store address.
 * @param {number} ownerId - ID of the store owner (user).
 * @param {string} email - Store email.
 * @returns {Promise<number|null>} The new store's ID, or null on failure.
 */
async function createStore(name, address, ownerId, email) {
    try {
        const result = await db.query(
            `INSERT INTO stores (name, address, owner_id, email)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [name, address, ownerId, email]
        );
        console.log(`✅ Store created: ${name} (Owner ID: ${ownerId})`);
        return result.rows[0].id;
    } catch (err) {
        console.error(`❌ Error creating store ${name}:`, err.message);
        return null;
    }
}

/**
 * Checks if a rating for a specific user and store already exists.
 * @param {number} userId - ID of the user.
 * @param {number} storeId - ID of the store.
 * @returns {Promise<boolean>} True if the rating exists, false otherwise.
 */
async function ratingExists(userId, storeId) {
    try {
        const result = await db.query(
            'SELECT 1 FROM ratings WHERE user_id = $1 AND store_id = $2',
            [userId, storeId]
        );
        return result.rows.length > 0;
    } catch (err) {
        console.error(`Error checking if rating (User: ${userId}, Store: ${storeId}) exists:`, err.message);
        return false;
    }
}

/**
 * Creates a new rating.
 * @param {number} userId - ID of the user submitting the rating.
 * @param {number} storeId - ID of the store being rated.
 * @param {number} score - Rating score (1-5).
 * @param {string} text - Optional comment for the rating.
 * @returns {Promise<void>}
 */
async function createRating(userId, storeId, score, text) {
    try {
        // Check if rating already exists to prevent duplicates
        if (await ratingExists(userId, storeId)) {
            console.log(`⚠️ Rating for User ${userId} on Store ${storeId} already exists. Skipping.`);
            return;
        }

        await db.query(
            `INSERT INTO ratings (user_id, store_id, score, text)
             VALUES ($1, $2, $3, $4)`,
            [userId, storeId, score, text]
        );
        console.log(`✅ Rating created: User ${userId} rated Store ${storeId} with ${score} stars.`);
    } catch (err) {
        console.error(`❌ Error creating rating (User: ${userId}, Store: ${storeId}):`, err.message);
    }
}

/**
 * Seeds the database with demo data.
 * @returns {Promise<void>}
 */
export async function seedDemoData() {
    console.log("--- Starting Demo Data Seeding ---");

    // --- 1. Check if essential users already exist ---
    const adminExists = await userExists('admin1@og.com');
    const owner1Exists = await userExists('owner1@og.com');
    const owner2Exists = await userExists('owner2@og.com');
    const user1Exists = await userExists('user1@og.com');

    if (adminExists && owner1Exists && owner2Exists && user1Exists) {
        console.log("✅ Demo data (essential users) already exist. Skipping seeding.");
        console.log("--- Demo Data Seeding Completed (Skipped) ---");
        return;
    }

    console.log("🔍 Essential users not found. Proceeding with seeding...");

    // --- 2. Create Users ---

    // Admin
    let adminId = null;
    if (!adminExists) {
        adminId = await createUser('Admin User', 'admin7@og.com', 'admin', 'Central Admin Office, Metropolis');
    } else {
        const adminRes = await db.query('SELECT id FROM users WHERE email = $1', ['admin7@og.com']);
        adminId = adminRes.rows[0]?.id;
        console.log(`ℹ️ Admin already exists: admin7@og.com (ID: ${adminId})`);
    }

    // Store Owners
    let owner1Id = null;
    let owner2Id = null;
    if (!owner1Exists) {
        owner1Id = await createUser('Store Owner One', 'owner1@og.com', 'store_owner', 'Owner One Residence, Townsville');
    } else {
        const owner1Res = await db.query('SELECT id FROM users WHERE email = $1', ['owner1@og.com']);
        owner1Id = owner1Res.rows[0]?.id;
        console.log(`ℹ️ Store Owner 1 already exists: owner1@og.com (ID: ${owner1Id})`);
    }

    if (!owner2Exists) {
        owner2Id = await createUser('Store Owner Two', 'owner2@og.com', 'store_owner', 'Owner Two Residence, Villagetown');
    } else {
        const owner2Res = await db.query('SELECT id FROM users WHERE email = $1', ['owner2@og.com']);
        owner2Id = owner2Res.rows[0]?.id;
        console.log(`ℹ️ Store Owner 2 already exists: owner2@og.com (ID: ${owner2Id})`);
    }

    // Normal Users
    const userIds = [];
    const userPrefixes = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    for (let i = 0; i < 5; i++) {
        const userEmail = `user${i + 1}@og.com`;
        let userId = null;
        if (!(await userExists(userEmail))) {
            userId = await createUser(
                `${userPrefixes[i]} User`,
                userEmail,
                'normal_user',
                `${userPrefixes[i]}'s Home, Usercity`
            );
        } else {
            const userRes = await db.query('SELECT id FROM users WHERE email = $1', [userEmail]);
            userId = userRes.rows[0]?.id;
            console.log(`ℹ️ Normal User ${i+1} already exists: ${userEmail} (ID: ${userId})`);
        }
        if (userId) userIds.push(userId);
    }

    // Ensure owner IDs are available for store creation
    if (!owner1Id || !owner2Id) {
         // Refetch if they existed but weren't captured
         if(!owner1Id) {
             const owner1Res = await db.query('SELECT id FROM users WHERE email = $1', ['owner1@og.com']);
             owner1Id = owner1Res.rows[0]?.id;
         }
         if(!owner2Id) {
             const owner2Res = await db.query('SELECT id FROM users WHERE email = $1', ['owner2@og.com']);
             owner2Id = owner2Res.rows[0]?.id;
         }
         if (!owner1Id || !owner2Id) {
             console.error("❌ Failed to get Store Owner IDs. Cannot create stores.");
             console.log("--- Demo Data Seeding Completed (Failed) ---");
             return;
         }
    }

    // --- 3. Create Stores ---
    const storeIds = [];

    // Stores for Owner 1
    const owner1StoreNames = ['Tech Gadgets Emporium', 'Gourmet Corner Deli', 'Urban Fashion Outlet', 'Bookworm\'s Paradise'];
    for (let i = 0; i < 4; i++) {
        const storeName = `${owner1StoreNames[i]}`;
        if (!(await storeExists(storeName))) {
            const storeId = await createStore(
                storeName,
                `123 Main St, Store ${i+1} District`,
                owner1Id,
                `info@${storeName.toLowerCase().replace(/\s+/g, '_')}1.com`
            );
            if (storeId) storeIds.push(storeId);
        } else {
            const storeRes = await db.query('SELECT id FROM stores WHERE name = $1', [storeName]);
            const storeId = storeRes.rows[0]?.id;
            console.log(`ℹ️ Store ${storeName} already exists (ID: ${storeId}).`);
            if (storeId) storeIds.push(storeId); // Add existing store ID for rating
        }
    }

    // Stores for Owner 2
    const owner2StoreNames = ['Cozy Coffee Corner', 'Fitness Fanatics Gym', 'Pet Palace Supplies', 'Artisan Crafts Bazaar'];
    for (let i = 0; i < 4; i++) {
        const storeName = `${owner2StoreNames[i]}`;
        if (!(await storeExists(storeName))) {
            const storeId = await createStore(
                storeName,
                `456 Oak Ave, Store ${i+5} Area`,
                owner2Id,
                `contact@${storeName.toLowerCase().replace(/\s+/g, '_')}2.com`
            );
            if (storeId) storeIds.push(storeId);
        } else {
            const storeRes = await db.query('SELECT id FROM stores WHERE name = $1', [storeName]);
            const storeId = storeRes.rows[0]?.id;
            console.log(`ℹ️ Store ${storeName} already exists (ID: ${storeId}).`);
            if (storeId) storeIds.push(storeId); // Add existing store ID for rating
        }
    }

    // --- 4. Create Ratings ---
    // Ensure we have user IDs and store IDs
    // Refetch user IDs if needed
    if (userIds.length === 0) {
        const usersRes = await db.query("SELECT id FROM users WHERE role = 'normal_user' AND email LIKE 'user%@og.com'");
        usersRes.rows.forEach(row => userIds.push(row.id));
    }  

    console.log(`📝 Creating ratings from ${userIds.length} users for ${storeIds.length} stores...`);

    for (const userId of userIds) {
        for (const storeId of storeIds) {
            // Generate a random score and a simple comment
            const score = Math.floor(Math.random() * 5) + 1; // Random int between 1 and 5
            const comments = [
                `Great service at ${storeId}!`,
                `Loved shopping here.`,
                `Found what I needed quickly.`,
                `Friendly staff.`,
                `Will visit again soon.`,
                `Good variety of products.`,
                `Nice ambiance.`,
                `Fair prices.`,
                `Efficient checkout.`,
                `Recommend this place!`
            ];
            const text = comments[Math.floor(Math.random() * comments.length)];

            await createRating(userId, storeId, score, text);
        }
    }

    console.log("--- Demo Data Seeding Completed Successfully ---");
}