import cron from 'node-cron';
import dotenv from 'dotenv';
import axios from 'axios';

import pkg from 'pg'; // Import the entire 'pg' module
const { Pool } = pkg; // Destructure the Pool class from the imported module

// import { Pool } from 'pg';
// dotenv.config();
const pool = new Pool({
  user: process.env.DB_USER || 'moonfinderpg',
  host: process.env.DB_HOST || '3.23.66.181',
  database: process.env.DB_NAME || 'moonfinder_db',
  password: process.env.DB_PASSWORD || 'moon',
  port: process.env.DB_PORT || 5432,
});

export default pool;

// Utility function to format timestamps
const formatTimestamp = (date) => {
  return date.toISOString().replace('T', ' ').substring(0, 19); // Format: "YYYY-MM-DD HH:MM:SS"
};

// Function to fetch live prices from CoinGecko
const fetchLivePrices = async () => {
  // console.log('FETCHING LIVE PRICES...');
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          price_change_percentage: '1h,24h,7d',
        },
      }
    );

    // Convert the array into a mapping for quick lookups
    const priceMap = {};
    response.data.forEach((coin) => {
      priceMap[coin.id] = coin.current_price;
    });

    return priceMap;
  } catch (error) {
    console.error('Error fetching live prices:', error.message);
    throw new Error('Failed to fetch live prices');
  }
};

// Updated function to get the total value and assets for a hootfolio
const getHootfolioData = async (hootfolioId, priceMap) => {
  try {
    // Query assets for the hootfolio
    const assetsQuery = `
      SELECT asset_id, balance
      FROM hootfolio_assets
      WHERE hootfolio_id = $1
    `;
    const { rows: assets } = await pool.query(assetsQuery, [hootfolioId]);

    // Calculate total value using live prices
    let totalValue = 0;
    const assetsSnapshot = assets.map(({ asset_id, balance }) => {
      const currentPrice = priceMap[asset_id] || 0; // Use live price or default to 0
      const totalAssetValue = balance * currentPrice;
      totalValue += totalAssetValue;

      return {
        asset_id,
        balance,
        current_price: currentPrice,
        total_value: totalAssetValue,
      };
    });

    return { totalValue, assetsSnapshot };
  } catch (error) {
    console.error(
      `Error fetching hootfolio data for ID ${hootfolioId}:`,
      error.message
    );
    throw error;
  }
};

// Function to take a snapshot for a batch of hootfolios
const takeSnapshotBatch = async (hootfolioIds, priceMap) => {
  const timestamp = formatTimestamp(new Date());

  for (const hootfolioId of hootfolioIds) {
    try {
      // Get total value and assets snapshot
      const { totalValue, assetsSnapshot } = await getHootfolioData(
        hootfolioId,
        priceMap
      );

      // Insert snapshot into hootfolio_value_history
      const insertQuery = `
        INSERT INTO hootfolio_value_history (hootfolio_id, timestamp, total_value, assets_snapshot)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insertQuery, [
        hootfolioId,
        timestamp,
        totalValue,
        JSON.stringify(assetsSnapshot), // Store assets as JSON
      ]);

      // console.log(`Snapshot taken for hootfolio ID ${hootfolioId} at ${timestamp}`);
    } catch (error) {
      console.error(
        `Failed to take snapshot for hootfolio ID ${hootfolioId}:`,
        error
      );
    }
  }
};

// Function to take snapshots for all hootfolios in batches
const takeSnapshots = async () => {
  console.log('Starting snapshot process:', new Date());

  try {
    // Fetch live prices once at the beginning
    const priceMap = await fetchLivePrices();

    // Query all hootfolio IDs
    const hootfoliosQuery = 'SELECT id FROM hootfolios';
    const { rows: hootfolios } = await pool.query(hootfoliosQuery);
    const hootfolioIds = hootfolios.map((row) => row.id);

    if (!hootfolioIds.length) {
      console.log('No hootfolios found.');
      return;
    }

    // Define batch size
    const batchSize = 10;

    // Process hootfolios in batches
    for (let i = 0; i < hootfolioIds.length; i += batchSize) {
      const batch = hootfolioIds.slice(i, i + batchSize);
      // console.log(`Processing batch: ${batch}`);
      await takeSnapshotBatch(batch, priceMap); // Pass the fetched prices to avoid redundant calls
    }
  } catch (error) {
    console.error('Error during snapshot process:', error);
  }
};

// RUN EVERY 30 SECONDS
// cron.schedule('*/10 * * * * *', async () => {

// RUN EVERY 1 HOUR
cron.schedule('0 * * * *', async () => {
  // RUN EVERY 5 MINS
  // cron.schedule('*/5 * * * *', async () => {

  console.log('Running scheduled snapshot...');
  await takeSnapshots();
});
