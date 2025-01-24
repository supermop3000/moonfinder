import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const API_URL =
    (process.env.REACT_APP_URL || 'https://localhost:3000') + '/api';
  const navigate = useNavigate();

  const [hootfolios, setHootfolios] = useState([]);

  useEffect(() => {
    const fetchHootfolios = async () => {
      try {
        const response = await fetch(`${API_URL}/hootfolio/${user.id}`);
        const data = await response.json();
        setHootfolios(data.hootfolio);
      } catch (error) {
        console.error('Error fetching hootfolios:', error);
      }
    };

    fetchHootfolios();
  }, [user]);

  const handleHootfolioClick = (hootfolioId) => {
    // navigate(`/hootfolio/${hootfolioId}`);
    navigate(`/hootfolio/`);
  };

  return (
    <div className="Profile">
      <div className="profile-section">
        <div className="profile-box">
          <h2>Username</h2>
          <p>{user.username}</p>
        </div>
      </div>
      <div className="hootfolios-section">
        <h2>Hootfolios</h2>
        <ul className="hootfolio-list">
          {hootfolios.map((hootfolio) => (
            <li
              key={hootfolio.id}
              className="hootfolio-item"
              onClick={() => handleHootfolioClick(hootfolio.id)}
            >
              <div className="hootfolio-name">{hootfolio.name}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
