import express from 'express';
import axios from 'axios';
import {
  checkMarketDataCache,
  setMarketDataCache,
} from '../middleware/liveCoinCache.js'; // Import cache middleware

const router = express.Router();

const API_URL = 'https://api.coingecko.com/api/v3/coins/markets';

// Route to fetch cryptocurrency data from CoinGecko
router.get('/', checkMarketDataCache, async (req, res) => {
  console.log('Fetching data from CoinGecko...'); // Log the start of the API call

  try {
    // Make the API call to get live data from CoinGecko
    const response = await axios.get(API_URL, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h,7d',
      },
    });

    // Store the fetched data in cache
    setMarketDataCache(response.data);

    // Send the live data to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error.message); // Log errors
    res.status(500).json({ error: 'Failed to fetch data from CoinGecko.' });
  }
});

export default router;
