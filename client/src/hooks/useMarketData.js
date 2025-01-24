// src/hooks/useMarketData.js
import { useEffect, useState } from 'react';

const useMarketData = () => {
  const API_URL = '/api';
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live data from the backend
  const fetchMarketData = async () => {
    try {
      const response = await fetch(`/api/live`);
      const data = await response.json();

      setMarketData(data);

      // Optionally store the fetched data in localStorage
      localStorage.setItem('marketData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

    // Set up interval to fetch data every 30 seconds
    const intervalId = setInterval(fetchMarketData, 30000);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  return { marketData, loading }; // Return marketData and loading instead of cryptoData
};

export default useMarketData;
