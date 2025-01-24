import express from 'express';
import axios from 'axios'; // Use import instead of require
import Moralis from 'moralis'; // Use import for Moralis
import { checkCache, setCache } from '../middleware/hootfolioCache.js'; // Import cache middleware with ES Modules
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Environment variable for API key (consider storing it in .env)
const apiKey = process.env.MORALIS_API_KEY;
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets';

// Route to fetch cryptocurrency asset data from Moralis
router.get('/', checkCache, async (req, res) => {
  const { coinCode, chainHex, address } = req.query;

  // Log the full query to see what's being received
  console.log(`Received Query: ${JSON.stringify(req.query)}`); // This should log an object with 'coin_code', 'chain_hex', and 'address'
  if (!coinCode || !chainHex || !address) {
    return res
      .status(400)
      .json({ error: 'Address, coin type, and chain hex are required' });
  }

  console.log(`Fetching data for ${coinCode} from Moralis...`);

  try {
    await Moralis.start({
      apiKey: apiKey,
    });

    const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: chainHex,
      address: address,
    });

    console.log('Full response from Moralis API:', response);

    // Access the actual token balances data inside the response
    const data = response.json.result; // The array of token balances

    console.log('Fetched asset data:', data); // Log the token balances

    res.json(data); // Send the data back to the client
  } catch (e) {
    console.error(e);
  }

  // Optional: If you want to keep the old BlockCypher method for fallback
  /*
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Store the fetched data in cache
    setCache(coin_code, address, data);

    // Return the data to the client
    res.json(data);
  } catch (error) {
    console.error(`Error fetching data from BlockCypher:`, error.message);
    res.status(500).json({ error: 'Failed to fetch data from BlockCypher.' });
  }
  */
});

// Export the router using ES Module syntax
export default router;
