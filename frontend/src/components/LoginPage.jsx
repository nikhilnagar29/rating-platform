// frontend/src/components/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo credentials
  const demoCredentials = {
    admin: { email: 'admin@og.com', password: 'admin@123' },
    user: { email: 'user56@og.com', password: 'user@123' },
    owner: { email: 'owener1@og.com', password: 'owener@123' },
  };

  const handleDemoLogin = (type) => {
    const creds = demoCredentials[type];
    setEmail(creds.email);
    setPassword(creds.password);
    // Optionally auto-submit
    // handleSubmitLogin(creds.email, creds.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('API Base:', import.meta.env.VITE_API_URL);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/login`, {
        email,
        password,
      });

      console.log('Login response:', res.data);

      // Save token and user
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect based on role
      const { role } = res.data.user;
      if (role === 'admin') window.location.href = '/dashboard';
      else if (role === 'store_owner') window.location.href = '/owner';
      else if (role === 'normal_user') window.location.href = '/user';
      else window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '10px',
            padding: '10px 15px',
            width: '100%',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Demo Buttons */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Or login as demo user:</p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#DC3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Admin
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('user')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#28A745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Normal User
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('owner')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFC107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Store Owner
          </button>
        </div>
      </div>

      {/* // Inside your login form, perhaps below the login button or in a footer section */}
      <div className="text-sm text-center mt-8">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>

      {/* Optional: Auto-submit version */}
      {/* If you want buttons to auto-login, replace onClick with:
        onClick={() => handleSubmitLogin(demoCredentials.admin.email, demoCredentials.admin.password)}
       and move handleSubmit logic into a separate function
      */}
    </div>
  );
};

export default LoginPage;