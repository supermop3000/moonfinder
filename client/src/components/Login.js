import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Please enter valid credentials');
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    console.log('ATTEMPTING TO LOGIN FROM LOGIN.JS');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        if (isLogin) {
          // Login: Use context's login function
          await login(username, password); // Delegates authentication to AuthContext
          console.log('LOGGED IN');
          navigate('/hootfolio'); // Redirect on successful login
        } else {
          // Registration was successful, log in the user automatically
          await login(username, password); // Automatically logs in after registration
          navigate('/hootfolio');
        }
      } else {
        // Handle server errors
        const errorData = await response.json();
        setError(errorData.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('Error during login/register:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-form">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>

      {error && <p className="error-message">{error}</p>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown} // Listen for Enter key
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown} // Listen for Enter key
      />
      <button onClick={handleSubmit}>{isLogin ? 'Login' : 'Register'}</button>

      <div>
        {isLogin ? (
          <p className="have_account">
            Don't have an account?{' '}
            <span
              className="register_account"
              style={{ color: 'white', cursor: 'pointer' }}
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              Register here.
            </span>
          </p>
        ) : (
          <p className="have_account">
            Already have an account?{' '}
            <span
              className="register_account"
              style={{ color: 'white', cursor: 'pointer' }}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Login here
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
