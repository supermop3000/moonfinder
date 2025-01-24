import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log('Checking authentication');
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Track authentication status

  useEffect(() => {
    const isTokenExpired = (token) => {
      if (!token) return true;

      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      return payload.exp <= now; // Compare expiration time
    };

    const restoreSession = async () => {
      try {
        setIsAuthenticating(true); // Start authentication process
        const storedToken = localStorage.getItem('accessToken');
        let tokenToUse = storedToken;

        if (!storedToken || isTokenExpired(storedToken)) {
          console.log(
            'Access token missing or expired. Attempting to refresh...'
          );
          const refreshResponse = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshResponse.ok) {
            console.log('Refresh token successful');
            const refreshData = await refreshResponse.json();
            tokenToUse = refreshData.accessToken;

            localStorage.setItem('accessToken', refreshData.accessToken);
            setAccessToken(refreshData.accessToken);
          } else {
            console.error(
              'Failed to refresh token:',
              refreshResponse.statusText
            );
            logout();
            return;
          }
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setIsLoggedIn(true);
        } else {
          console.error(
            'Failed to restore session from /api/auth/me:',
            response.statusText
          );
          logout();
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        logout();
      } finally {
        setIsAuthenticating(false); // End authentication process
      }
    };

    restoreSession();
  }, []);

  const login = async (username, password) => {
    console.log('AUTH CONTEXT LOGIN');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to log in');
      }

      const data = await response.json();
      setUser(data.user);
      setAccessToken(data.accessToken);
      setIsLoggedIn(true);

      localStorage.setItem('accessToken', data.accessToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoggedIn,
        isAuthenticating, // Provide the authenticating state
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
