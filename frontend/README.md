frontend/src/
├── main.jsx
├── App.jsx
├── index.css
├── components/
│   ├── LoginPage.jsx
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx  <-- New: For guarding routes
│   └── ...
├── pages/
│   ├── Admin/
│   │   ├── Dashboard.jsx
│   │   ├── UsersList.jsx
│   │   ├── StoresList.jsx
│   │   └── ...
│   ├── User/
│   │   ├── Home.jsx
│   │   ├── StoreList.jsx
│   │   └── ...
│   ├── Owner/
│   │   ├── Dashboard.jsx
│   │   └── ...
│   └── NotFound.jsx  <-- New: For 404s
├── services/
│   └── api.js  <-- New: Centralized API calls
└── utils/
    └── auth.js  <-- New: Helper functions for auth