# Store Rating Platform - Frontend

This directory contains the React.js frontend application for the Store Rating Platform. It provides user interfaces for Normal Users, Store Owners, and System Administrators to interact with the platform according to their defined roles and permissions.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Authentication & Routing](#authentication--routing)
- [Environment Variables](#environment-variables)


## Features

Based on the project requirements, the frontend implements distinct views and functionalities for different user roles:

### Normal User
- **Authentication**: Login and Registration.
- **Profile Management**: Change password.
- **Store Interaction**:
    - View a list of all registered stores.
    - Search/filter stores (by Name/Address - logic implemented, UI can be enhanced).
    - View detailed store information (name, address, average rating).
    - Submit a new rating (1-5 stars, optional comment) for a store.
    - View and edit their own previously submitted rating for a store.
    - View a list of all their own submitted ratings.

### Store Owner
- **Authentication**: Login.
- **Profile Management**: Change password.
- **Dashboard**:
    - View a consolidated list of all stores they own.
    - View detailed information for a specific store, including:
        - Store details (name, address, contact).
        - Store metrics (average rating, total ratings count).
        - A list of all ratings submitted for that store by different users.
    - View a summary report showing users who have rated their stores and the ratings submitted.

### System Administrator
- **Authentication**: Login.
- **Dashboard**:
    - View key metrics (total users, stores, ratings).
- **User Management**:
    - Create new users (Admin, Normal User, Store Owner).
    - View a list of all users.
    - View detailed information for a specific user.
- **Store Management**:
    - Create new stores and assign them to Store Owners.
    - View a list of all stores.
    - View detailed information for a specific store.

## Technologies Used

- **React.js**: Core library for building the user interface.
- **React Router DOM v6**: Declarative routing for navigation between different pages/views.
- **Axios**: Promise-based HTTP client for making API requests to the backend.
- **Tailwind CSS**: Utility-first CSS framework for rapidly building custom designs (assuming based on class names like `p-4`, `bg-white`, etc.). If using a different styling approach, adjust accordingly.
- **Vite** (or Create React App): Likely build tool/bundler (inferred from `import.meta.env` and project structure).
- **JavaScript (ES6+ Modules)**: Language features used throughout.

## Project Structure

The frontend code is organized to separate concerns, making it easier to locate and manage components, pages, utilities, and styles.



*(Note: Actual file structure might vary slightly, e.g., `EditRatingForm.jsx` is mentioned in `App.jsx` but located in `components/user/`.)*

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js** (version specified in `package.json` engines, e.g., >=18)
- **npm** or **yarn** (package managers)
- **Backend API**: The frontend requires the backend services (API, Database) to be running. Typically managed via Docker Compose.

### Installation

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application

*(Assuming the backend is running via `docker-compose up -d --build` from the project root)*

1.  From the `frontend` directory, start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
2.  Open your browser and visit `http://localhost:5173` (or the port specified by your dev server).

## Development Workflow

1.  Ensure the backend is running.
2.  Start the frontend dev server (`npm run dev`).
3.  Make code changes.
4.  The dev server (likely Vite) provides Hot Module Replacement (HMR) for fast feedback.
5.  Commit changes following your project's conventions.

## Authentication & Routing

- **Authentication**: Handled using `localStorage` to store the `authToken` (JWT) and user object.
- **`utils/auth.js`**: Contains helper functions like `isAuthenticated()` to check login status.
- **`components/ProtectedRoute.jsx`**: A wrapper component that checks if a user is authenticated and has the required role(s) to access a specific route. If not, it redirects to the login page.
- **`App.jsx`**: Centralizes route definitions using `react-router-dom` v6. Routes are nested and protected using `ProtectedRoute`. Public routes (`/login`, `/register`) are also defined here.

## Environment Variables

Variables are defined in the `.env` file in the `frontend` root directory.

- `VITE_API_URL`: The base URL of the backend API (e.g., `http://localhost:5000/api`). Vite exposes variables prefixed with `VITE_` to the client-side code.

Example `.env`:
```env
VITE_API_URL=http://localhost:5000/api