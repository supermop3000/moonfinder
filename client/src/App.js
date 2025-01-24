import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import logo from './logo_purple2.png';
import './App.css';
import Market from './pages/Market';
import About from './pages/About';
import AI from './pages/AI';
import Swap from './pages/Swap';
import Hootfolio from './pages/Hootfolio';
import Profile from './pages/Profile';
import Documenter from './pages/Documenter';
import Login from './components/Login';
import { useAuth, AuthProvider } from './context/AuthContext';
import useScreenSize from './hooks/useScreenSize';
import GoogleAnalytics from './components/GoogleAnalytics';
import CoinDetails from './pages/CoinDetails';
import { BsFillRocketTakeoffFill } from 'react-icons/bs';
import { FaBalanceScale } from 'react-icons/fa';
import { PiSwapDuotone } from 'react-icons/pi';
import { GiBirdHouse } from 'react-icons/gi';

function App() {
  console.log('STARTING WEB APP');
  return (
    <>
      <GoogleAnalytics />
      <AuthProvider>
        <Router>
          <Main />
        </Router>
      </AuthProvider>
    </>
  );
}

function Main() {
  const { screenWidth } = useScreenSize();
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState(location.pathname); // Default selected tab

  useEffect(() => {
    setSelectedTab(location.pathname);
  }, [location]);

  const handleSelect = (tab) => {
    setSelectedTab(tab); // Update the selected tab when clicked
  };

  return (
    <div className="App">
      <header id="app-header" className="App-header">
        <nav className="navbar">
          <div className="navbar-content">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <img src={logo} className="App-logo" alt="logo" />
            </Link>
            <Link
              to="/"
              style={{ textDecoration: 'none', fontSize: '22px' }}
              className="App-title"
            >
              MoonFinder
            </Link>
            <ul>
              {screenWidth <= 768 ? (
                <>
                  {/* Mobile Links */}
                  <li
                    className={selectedTab === '/market' ? 'selected' : ''}
                    onClick={() => handleSelect('/market')}
                  >
                    <Link to="/market" className="icon-link" title="Market">
                      <FaBalanceScale />
                    </Link>
                  </li>

                  <li
                    className={selectedTab === '/swap' ? 'selected' : ''}
                    onClick={() => handleSelect('/swap')}
                  >
                    <Link to="/swap" className="icon-link" title="Swap">
                      <PiSwapDuotone />
                    </Link>
                  </li>

                  <li
                    className={selectedTab === '/hootfolio' ? 'selected' : ''}
                    onClick={() => handleSelect('/hootfolio')}
                  >
                    <Link
                      to="/hootfolio"
                      className="icon-link"
                      title="Hootfolio"
                    >
                      <BsFillRocketTakeoffFill />
                    </Link>
                  </li>

                  <HeaderButtons />
                </>
              ) : (
                <>
                  {/* Desktop Links */}
                  <li
                    className={selectedTab === '/market' ? 'selected' : ''}
                    onClick={() => handleSelect('/market')}
                  >
                    <Link to="/market">Market</Link>
                  </li>
                  {/* <li
                    className={selectedTab === '/ai' ? 'selected' : ''}
                    onClick={() => handleSelect('/ai')}
                  >
                    <Link to="/ai">AI</Link>
                  </li> */}
                  <li
                    className={selectedTab === '/swap' ? 'selected' : ''}
                    onClick={() => handleSelect('/swap')}
                  >
                    <Link to="/swap">Swap</Link>
                  </li>
                  <li
                    className={selectedTab === '/hootfolio' ? 'selected' : ''}
                    onClick={() => handleSelect('/hootfolio')}
                  >
                    <Link to="/hootfolio">Hootfolio</Link>
                  </li>
                  <div className="header-right">
                    <HeaderButtons />
                  </div>
                </>
              )}
            </ul>
          </div>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Market />} />
          <Route path="/market" element={<Market />} />
          <Route path="/about" element={<About />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/hootfolio" element={<Hootfolio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coins/:id" element={<CoinDetails />} />
          <Route path="/documenter" element={<Documenter />} />
        </Routes>
      </main>
    </div>
  );
}

function HeaderButtons() {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownVisible((prev) => !prev);
  };

  const closeDropdown = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownVisible(false);
    }
  };

  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    toggleDropdown();
    navigate('/');
  };

  const handleProfileClick = () => {
    toggleDropdown();
    navigate('/profile');
  };

  // Reset dropdown visibility when component mounts
  useEffect(() => {
    setIsDropdownVisible(false);
  }, []); // Runs only on mount

  useEffect(() => {
    document.addEventListener('click', closeDropdown);
    return () => {
      document.removeEventListener('click', closeDropdown); // Cleanup listener on unmount
    };
  }, []);

  return (
    <div className="header-buttons">
      {isLoggedIn ? (
        <div className="profile-container" ref={dropdownRef}>
          <button className="profile-button" onClick={toggleDropdown}>
            <GiBirdHouse className="user-icon" />{' '}
            {/* Replace with GiBirdHouse */}
          </button>

          <div
            className={`profile-dropdown-container ${
              isDropdownVisible ? 'visible' : ''
            }`}
          >
            <div className="profile-dropdown-menu">
              <button
                className="profile-dropdown-item"
                onClick={handleProfileClick}
              >
                Profile
              </button>
              <button
                className="profile-dropdown-item"
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="login-button" onClick={() => navigate('/login')}>
          Login
        </button>
      )}
    </div>
  );
}

export default App;
