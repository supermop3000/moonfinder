// Store the cached data for each address
const hootfolioCache = {}; // A cache object to store data by coin and address
const cacheExpirationTime = 2 * 60 * 1000; // Cache expiration time of 2 minutes in milliseconds

// Middleware to check cache
const checkCache = (req, res, next) => {
  const { address, coin } = req.query;
  const cacheKey = `${coin}:${address}`; // Unique cache key based on coin and address

  // Get the current time
  const currentTime = Date.now();

  // Check if the cache exists and is still valid
  if (
    hootfolioCache[cacheKey] &&
    currentTime - hootfolioCache[cacheKey].timestamp < cacheExpirationTime
  ) {
    console.log(`Serving cached data for ${cacheKey}`);
    return res.json(hootfolioCache[cacheKey].data); // Send the cached data
  }

  // If cache is not valid, proceed with the API call
  next();
};

// Function to set cache
const setCache = (coin, address, data) => {
  const cacheKey = `${coin}:${address}`; // Unique cache key based on coin and address
  hootfolioCache[cacheKey] = {
    data: data,
    timestamp: Date.now(), // Store the time when the data was cached
  };
  console.log(`Data cached for ${cacheKey}`);
};

// Export the functions using ES Module syntax
export { checkCache, setCache };
