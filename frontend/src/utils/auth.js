// frontend/src/utils/auth.js

export const isAuthenticated = () => {
    return !!localStorage.getItem('authToken');
  };
  
  export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };
  
  export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };