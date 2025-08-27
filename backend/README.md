# Rating Platform - Backend API

A Node.js Express API server for a store rating platform that allows users to register, authenticate, and submit ratings for stores. The system supports role-based access control with three user types: admins, store owners, and regular users.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **pg** - PostgreSQL client
- **Nodemon** - Development auto-restart

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory:

```env
# Environment
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rating_platform
DB_USER=admin
DB_PASS=admin123

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=15m

# Server
PORT=5001
```

For Docker deployment, set `DB_HOST=db`.

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Database Schema

The application uses PostgreSQL with the following main tables:

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(60)) - User's full name
- `email` (VARCHAR(255) UNIQUE) - Email address
- `password_hash` (VARCHAR(255)) - Encrypted password
- `address` (VARCHAR(400)) - Physical address
- `role` (VARCHAR(20)) - User role: `admin`, `store_owner`, `normal_user`
- `created_at`, `updated_at` (TIMESTAMP)

### Stores Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(100)) - Store name
- `address` (VARCHAR(400)) - Store location
- `owner_id` (INTEGER FK) - References users.id
- `email` (VARCHAR(255)) - Contact email
- `created_at`, `updated_at` (TIMESTAMP)

### Ratings Table
- `rating_id` (SERIAL PRIMARY KEY)
- `store_id` (INTEGER FK) - References stores.id
- `user_id` (INTEGER FK) - References users.id
- `score` (INTEGER) - Rating value (1-5)
- `text` (TEXT) - Optional comment
- `likes_count` (INTEGER) - Number of likes
- `status` (VARCHAR(20)) - Status: `active`, `pending`, `rejected`
- `created_at`, `updated_at` (TIMESTAMP)

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## User Roles

- **admin**: Full access to all data and operations
- **store_owner**: Can manage their own stores and view ratings
- **normal_user**: Can view stores and submit ratings

## API Endpoints

### Authentication Routes (`/api/user`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/change-password` | Change password | Yes |

**Register Request:**
```json
{
  "name": "string (2-60 chars)",
  "email": "string (valid email)",
  "password": "string (8-16 chars, 1 uppercase, 1 special char)",
  "address": "string (optional, max 400 chars)"
}
```

**Login Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

### Admin Routes (`/api/admin`)

#### User Management
- `POST /create/user` - Create user with specific role
- `GET /users` - Get all users (paginated, filterable)
- `GET /users/:id` - Get user by ID
- `GET /search/users?q=term` - Search users

#### Store Management
- `POST /create/store` - Create store for owner
- `GET /stores` - Get all stores (paginated, filterable)
- `GET /stores/:id` - Get store by ID
- `GET /stores/owner/:ownerId` - Get stores by owner
- `GET /search/stores?q=term` - Search stores

#### Rating Management
- `GET /ratings` - Get all ratings (paginated, filterable)

#### Dashboard
- `GET /dashboard` - Get summary statistics

### Store Owner Routes (`/api/owner`)

- `POST /create/store` - Create new store
- `GET /stores` - Get all owned stores with ratings
- `GET /store/:store_id` - Get specific store details
- `GET /dashboard/ratings` - Get all ratings for owned stores

### User Routes (`/api/user`)

#### Store Browsing
- `GET /stores` - Get all stores (paginated, filterable)
- `GET /stores/:id` - Get store by ID
- `GET /search/stores?q=term` - Search stores
- `GET /stores/:storeId/detail` - Get store with all ratings

#### Rating Management
- `GET /ratings` - Get user's ratings
- `GET /stores/:storeId/ratings` - Get ratings for specific store
- `GET /rating/:ratingId` - Get specific rating
- `POST /rate/:store_id` - Submit new rating
- `PUT /rating/:ratingId` - Update existing rating

## Query Parameters

Most GET endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field
- `order` - Sort order (`asc`/`desc`)

Search and filter parameters vary by endpoint.

## Auto-Seeding

On startup, the server automatically seeds demo data if no essential users exist:
- 1 Admin user
- 2 Store owners
- 5 Regular users
- 8 Stores (4 per owner)
- Random ratings from users

## Default Users

| Email | Password | Role |
|-------|----------|------|
| admin7@og.com | Abcd@1234 | admin |
| owner1@og.com | Abcd@1234 | store_owner |
| owner2@og.com | Abcd@1234 | store_owner |
| user1@og.com | Abcd@1234 | normal_user |

## Error Responses

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message"
}
```

## Docker Support

The application is designed to work with Docker Compose. See `docker-compose.yml` for configuration.

## Development

```bash
# Install dependencies
npm install

# Start with auto-reload
npm run dev

# Run tests (if available)
npm test
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection protection via parameterized queries
- Role-based access control

## Database Triggers

The system includes PostgreSQL triggers for:
- Automatic `updated_at` timestamp updates
- Data validation constraints
- Rating score validation (1-5 range)

## API Rate Limiting

Consider implementing rate limiting for production deployments to prevent abuse.

## Contributing

1. Follow existing code style
2. Add appropriate error handling
3. Update documentation for new endpoints
4. Test all changes thoroughly

## License

MIT License