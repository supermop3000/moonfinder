const marketDataCache = {}; // Store the cached data
const cacheExpirationTime = 2 * 60 * 1000; // 2 minutes in milliseconds

// Middleware to check and set cache
const checkMarketDataCache = async (req, res, next) => {
  const currentTime = Date.now();

  // Check if cache exists and is still valid
  if (
    marketDataCache.data &&
    currentTime - marketDataCache.timestamp < cacheExpirationTime
  ) {
    console.log('Serving cached data');
    return res.json(marketDataCache.data); // Send cached data
  }

  // If no valid cache, move to the next middleware (or fetch from the API)
  console.log('Cache expired or not available, fetching new data');
  next();
};

// Function to set cache (you can call this after fetching data from the API)
const setMarketDataCache = (data) => {
  marketDataCache.data = data;
  marketDataCache.timestamp = Date.now();
  console.log('Cache updated');
};

export { checkMarketDataCache, setMarketDataCache };
