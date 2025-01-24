import axios from 'axios';
import fs from 'fs';
import path from 'path';

// File to save coin asset IDs
const assetIdsFile = path.resolve('coin_asset_ids.json');

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch all coin asset IDs
const fetchAndSaveCoinAssetIds = async () => {
  const url = 'https://api.coingecko.com/api/v3/coins/list';

  try {
    console.log('Fetching all coin asset IDs from CoinGecko...');
    const { data } = await axios.get(url);

    if (data && data.length > 0) {
      const assetIds = data.map((coin) => coin.id); // Extract only the `id`
      fs.writeFileSync(assetIdsFile, JSON.stringify(assetIds, null, 2));
      console.log(`Saved ${assetIds.length} coin asset IDs to ${assetIdsFile}`);
    } else {
      console.log('No coin data retrieved from CoinGecko.');
    }
  } catch (error) {
    console.error('Error fetching coin asset IDs:', error.message);
  }
};

// Load coin asset IDs from file
const loadCoinAssetIdsFromFile = () => {
  if (fs.existsSync(assetIdsFile)) {
    console.log(`Loading coin asset IDs from ${assetIdsFile}`);
    return JSON.parse(fs.readFileSync(assetIdsFile, 'utf8'));
  } else {
    console.log(`File ${assetIdsFile} not found.`);
    return [];
  }
};

// Main function
const start = async () => {
  console.log('FETCHING');
  if (!fs.existsSync(assetIdsFile)) {
    await fetchAndSaveCoinAssetIds(); // Fetch and save if the file doesn't exist
  } else {
    console.log('Coin asset IDs file already exists. Skipping fetch.');
  }

  const coinAssetIds = loadCoinAssetIdsFromFile();
  console.log(`Loaded ${coinAssetIds.length} coin asset IDs.`);
};

start();
