import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

// Base URL for Bybit's REST API
const BASE_URL = 'https://api.bybit.com';
const KEY_COINS = ['BTC', 'ETH', 'BNB', 'USDT', 'USD'];

// Fetch trading pairs data from Bybit
const fetchTradingPairs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/v5/market/tickers`, {
      params: {
        category: 'spot', // For spot market data; use 'linear' for perpetual contracts
      },
    });
    return response.data.result.list || []; // Array of trading pair data
  } catch (error) {
    console.error(
      'Error fetching trading pairs:',
      error.stack || error.message
    );
    return [];
  }
};

// Group trading pairs by base coin
const groupTradingPairsByCoin = (tradingPairs) => {
  const groupedPairs = {};

  for (const pair of tradingPairs) {
    // Extract the base coin and quote coin
    const quoteCoin = KEY_COINS.find((key) => pair.symbol.endsWith(key));
    if (!quoteCoin) continue;

    const baseCoin = pair.symbol.replace(quoteCoin, '');

    // Initialize the base coin in the dictionary if it doesn't exist
    if (!groupedPairs[baseCoin]) {
      groupedPairs[baseCoin] = [];
    }

    // Add the trading pair data to the base coin
    groupedPairs[baseCoin].push({
      symbol: pair.symbol,
      lastPrice: parseFloat(pair.lastPrice),
      priceChangePercent: parseFloat(pair.change24h), // Adjust for Bybit's API naming
      volume: parseFloat(pair.volume24h),
      highPrice: parseFloat(pair.highPrice24h),
      lowPrice: parseFloat(pair.lowPrice24h),
    });
  }

  return groupedPairs;
};

// Fetch and group trading pairs
const fetchAndGroupTradingPairs = async () => {
  const tradingPairs = await fetchTradingPairs();

  const groupedPairs = groupTradingPairsByCoin(tradingPairs);

  // Log the grouped pairs
  for (const [coin, pairs] of Object.entries(groupedPairs)) {
    console.log(`Base Coin: ${coin}`);
    console.table(pairs);
  }

  return groupedPairs;
};

// Execute the function immediately
await fetchAndGroupTradingPairs();

// Schedule the script to run every 10 seconds
cron.schedule('*/10 * * * * *', async () => {
  console.log('Fetching and grouping trading pairs...');
  await fetchAndGroupTradingPairs();
});
