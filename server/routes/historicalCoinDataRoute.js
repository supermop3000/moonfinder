import express from 'express';
import axios from 'axios'; // Use import instead of require
const router = express.Router();

router.get('/', async (req, res) => {
  const { coinId, vs_currency, days } = req.query;

  try {
    // Fetch historical data from CoinGecko
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: vs_currency || 'usd',
          days: days || '30', // Default to 30 days if not specified
        },
      }
    );

    const historicalData = response.data.prices.map((entry) => ({
      coin_id: coinId,
      timestamp: new Date(entry[0]), // Timestamp from CoinGecko (ms since epoch)
      price: entry[1], // Price at that timestamp
    }));

    res.json({
      message: 'Historical data stored successfully',
      data: historicalData,
    });
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    res
      .status(500)
      .json({ error: 'Failed to fetch historical data from CoinGecko.' });
  }
});

// Export the router using ES Module syntax
export default router;
