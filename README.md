
# Rating Platform

A full-stack web application for rating and reviewing stores, built with React, Node.js, and PostgreSQL. The platform supports role-based access control allowing admins, store owners, and regular users to interact with the system according to their permissions.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │    │     Backend     │    │   PostgreSQL    │
│   (React +      │◄──►│   (Node.js +    │◄──►│    Database     │
│   Tailwind)     │    │   Express)      │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     Port 5173              Port 5001              Port 5432
```

## Features

- **User Authentication**: Registration, login with JWT tokens
- **Role-Based Access**: Three user types (Admin, Store Owner, User)
- **Store Management**: Create, view, and manage stores
- **Rating System**: Submit and view 1-5 star ratings with comments
- **Search & Filter**: Find stores and users with various filters
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Dynamic data loading and pagination
- **Admin Dashboard**: Complete system management
- **Docker Support**: Containerized deployment

## Tech Stack

### Frontend
- **React 19** - UI library with hooks
- **Vite 7.1.2** - Build tool and development server
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **React Router DOM 7.8.2** - Client-side routing
- **Axios 1.11.0** - HTTP client for API calls
- **JWT Decode 4.0.0** - Token handling

### Backend
- **Node.js 20** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **pg** - PostgreSQL client for Node.js
- **Nodemon** - Development auto-restart

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL 15** - Database container

## Project Structure

```
rating-platform/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── README.md              # Frontend documentation
├── backend/                    # Node.js backend API
│   ├── routes/
│   │   ├── admin.js           # Admin endpoints
│   │   ├── owner.js           # Store owner endpoints
│   │   ├── user.js            # User endpoints
│   │   └── auth.js            # Authentication endpoints
│   ├── utils/
│   │   └── registerAdmin.js   # Data seeding utilities
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
├── migrations/
│   └── init-db.sql            # Database schema
├── docker-compose.yml         # Docker services configuration
├── Dockerfile.frontend        # Frontend container setup
├── Dockerfile.backend         # Backend container setup
└── README.md                  # Main documentation (this file)
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/nikhilnagar29/rating-platform.git
cd rating-platform

# Start all services with Docker
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Database**: localhost:5432 (internal access)

## Default User Accounts

The system automatically seeds with test accounts:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin1@og.com | Abcd@1234 | admin | Full system access |
| owner1@og.com | Abcd@1234 | store_owner | Manage own stores |
| owner2@og.com | Abcd@1234 | store_owner | Manage own stores |
| user1@og.com | Abcd@1234 | normal_user | View stores, submit ratings |
| user2@og.com | Abcd@1234 | normal_user | View stores, submit ratings |

## API Documentation

### Authentication Endpoints
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User authentication
- `POST /api/user/change-password` - Password update

### Admin Endpoints (`/api/admin`)
- User management (create, view, search)
- Store management (create, view, assign owners)
- Rating oversight (view all ratings)
- Dashboard analytics

### Store Owner Endpoints (`/api/owner`)
- `POST /create/store` - Create new store
- `GET /stores` - View owned stores
- `GET /store/:id` - Store details with ratings
- `GET /dashboard/ratings` - All ratings for owned stores

### User Endpoints (`/api/user`)
- `GET /stores` - Browse all stores
- `POST /rate/:store_id` - Submit rating
- `PUT /rating/:id` - Update rating
- `GET /ratings` - View own ratings

## Database Schema

### Core Tables

**users**
- Stores user accounts with role-based access
- Roles: admin, store_owner, normal_user

**stores**
- Store information and ownership
- Links to users table via owner_id

**ratings**
- User ratings for stores (1-5 scale)
- Includes text comments and status tracking

## Development

### Local Development Without Docker

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Database:**
Set up PostgreSQL locally and run the SQL schema from `migrations/init-db.sql`.

### Environment Configuration

Create `.env` files in both frontend and backend directories:

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5001/api
```

**Backend (.env):**
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rating_platform
DB_USER=admin
DB_PASS=admin123
JWT_SECRET=your_jwt_secret_key_here
PORT=5001
```

## Docker Configuration

### Services

- **frontend**: React app served by Vite dev server
- **backend**: Node.js Express API server
- **db**: PostgreSQL database with automatic initialization

### Volumes

- `postgres_data`: Persistent database storage
- `frontend_node_modules`: Isolated frontend dependencies
- Source code mounting for development hot-reload

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check if database is ready
docker-compose logs db
```

**Frontend Build Issues:**
```bash
# Rebuild frontend container
docker-compose build --no-cache frontend
```

**Port Conflicts:**
```bash
# Check port usage
lsof -i :5173  # Frontend
lsof -i :5001  # Backend
lsof -i :5432  # Database
```

### Reset Everything

```bash
# Complete reset
docker-compose down --volumes --remove-orphans
docker system prune -f
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow existing code style
- Update documentation for new features
- Test changes thoroughly
- Use meaningful commit messages

## Security

- Passwords hashed with bcrypt
- JWT token authentication
- Input validation on all endpoints
- SQL injection protection via parameterized queries
- Role-based access control

## Performance

- Pagination on all list endpoints
- Database indexing for common queries
- Efficient React component rendering
- Tailwind CSS for optimal bundle size

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review individual component README files
3. Check Docker logs: `docker-compose logs`
4. Create an issue on GitHub

## Links

- **Frontend Details**: [Frontend README](./frontend/README.md)
- **Backend API**: [Backend README](./backend/README.md)
- **Repository**: https://github.com/nikhilnagar29/rating-platform