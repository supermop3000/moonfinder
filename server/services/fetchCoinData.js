import axios from 'axios';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: '3.23.66.181',
  user: 'moonfinderpg',
  password: 'moon',
  database: 'moonfinder_db',
  port: 5432,
});

// const imageDir = path.resolve('images', 'coins');
const imageDir = '/Users/pluto/Desktop/moon-finder-coins/images/coins';
// const imageDir = '/var/www/moonfinder/images/coins';
const coinIdsFile = path.resolve('coin_asset_ids.json'); // File containing coin asset IDs
const failedCoins = [];

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load coin IDs from the file
const loadCoinAssetIds = () => {
  if (fs.existsSync(coinIdsFile)) {
    console.log(`Loading coin IDs from ${coinIdsFile}`);
    return JSON.parse(fs.readFileSync(coinIdsFile, 'utf8'));
  } else {
    console.error(`Coin ID file not found: ${coinIdsFile}`);
    return [];
  }
};

// Check if the coin already exists in the database
const coinExists = async (asset_id) => {
  const query = 'SELECT 1 FROM coin_info WHERE asset_id = $1 LIMIT 1';
  try {
    const result = await pool.query(query, [asset_id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(
      `Error checking coin existence for ${asset_id}:`,
      error.message
    );
    return false;
  }
};

// Save coin data to the database
const saveCoinData = async (coinData) => {
  const query = `
    INSERT INTO coin_info (
      asset_id, name, symbol, description, blockchain_site, homepage, links, web_slug, hashing_algorithm,
      block_time_in_minutes, circulating_supply, total_supply, max_supply, whitepaper, repos_url,
      subreddit_url, telegram_channel_identifier, bitcointalk_thread_identifier, facebook_username, twitter_screen_name,
      categories, image_paths, image_thumb_path, image_small_path, image_large_path, genesis_date, country_of_origin,
      developer_data, updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, NOW()
    )
    ON CONFLICT (asset_id) DO NOTHING;
  `;

  try {
    await pool.query(query, Object.values(coinData));
    console.log(`Saved data for coin: ${coinData.asset_id}`);
  } catch (error) {
    console.error(
      `Error saving coin data for ${coinData.asset_id}:`,
      error.message
    );
    throw error;
  }
};

// Save images locally
const saveImagesLocally = async (asset_id, image) => {
  const coinDir = path.join(imageDir, asset_id);

  if (!fs.existsSync(coinDir)) {
    fs.mkdirSync(coinDir, { recursive: true });
  }

  const thumbPath = path.join(coinDir, 'thumb.png');
  const smallPath = path.join(coinDir, 'small.png');
  const largePath = path.join(coinDir, 'large.png');

  try {
    if (image.thumb) await downloadImage(image.thumb, thumbPath);
    if (image.small) await downloadImage(image.small, smallPath);
    if (image.large) await downloadImage(image.large, largePath);

    console.log(`Images saved for ${asset_id}`);
    return {
      thumb: `/images/coins/${asset_id}/thumb.png`,
      small: `/images/coins/${asset_id}/small.png`,
      large: `/images/coins/${asset_id}/large.png`,
    };
  } catch (error) {
    console.error(`Error saving images for ${asset_id}: ${error.message}`);
    return { thumb: null, small: null, large: null };
  }
};

// Download image function
const downloadImage = async (url, dest) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
  }
};

// Fetch detailed data for a specific coin
const fetchCoinDetails = async (coinId) => {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error(`Error fetching coin details for ${coinId}:`, error.message);
    throw error;
  }
};

// Process a coin with retries
const processCoinWithRetries = async (coinId, maxRetries = 3) => {
  let attempts = 0;
  let delay = 20000;

  while (attempts < maxRetries) {
    try {
      console.log(`Processing coin: ${coinId} (Attempt ${attempts + 1})`);
      if (await coinExists(coinId)) {
        console.log(`Coin ${coinId} already exists. Skipping.`);
        return false; // Skip if exists
      }

      const details = await fetchCoinDetails(coinId);
      const imagePaths = await saveImagesLocally(coinId, details.image);

      const coinData = {
        asset_id: details.id,
        name: details.name,
        symbol: details.symbol,
        description: details.description,
        blockchain_site: JSON.stringify(details.links.blockchain_site || []),
        homepage: JSON.stringify(details.links.homepage || []),
        links: JSON.stringify(details.links || {}),
        web_slug: details.slug || null,
        hashing_algorithm: details.hashing_algorithm || null,
        block_time_in_minutes: details.block_time_in_minutes || null,
        circulating_supply: details.market_data?.circulating_supply || null,
        total_supply: details.market_data?.total_supply || null,
        max_supply: details.market_data?.max_supply || null,
        whitepaper: details.links.whitepaper?.link || null,
        repos_url: JSON.stringify(details.links.repos_url || []),
        subreddit_url: details.links.subreddit_url || null,
        telegram_channel_identifier:
          details.links.telegram_channel_identifier || null,
        bitcointalk_thread_identifier:
          details.links.bitcointalk_thread_identifier || null,
        facebook_username: details.links.facebook_username || null,
        twitter_screen_name: details.links.twitter_screen_name || null,
        categories: JSON.stringify(details.categories || []),
        image_paths: JSON.stringify(imagePaths),
        image_thumb_path: imagePaths.thumb || null,
        image_small_path: imagePaths.small || null,
        image_large_path: imagePaths.large || null,
        genesis_date: details.genesis_date || null,
        country_of_origin: details.country_of_origin || null,
        developer_data: details.developer_data || null,
      };

      await saveCoinData(coinData);
      console.log(`Successfully processed coin: ${coinId}`);
      return true; // Success
    } catch (error) {
      attempts++;
      console.error(`Error processing coin ${coinId}: ${error.message}`);
      if (attempts < maxRetries) {
        console.log(`Retrying coin ${coinId} in ${delay / 1000} seconds...`);
        await wait(delay);
        delay += 40000; // Increase delay
      } else {
        console.error(
          `Failed to process coin ${coinId} after ${maxRetries} attempts.`
        );
        failedCoins.push(coinId);
      }
    }
  }
  return false; // Failure
};

// Main processing function
const startProcessing = async () => {
  try {
    var coinIds = loadCoinAssetIds();
    if (!coinIds || coinIds.length === 0) {
      console.error(
        'No coin IDs found. Please ensure the coin_asset_ids.json file is populated.'
      );
      return;
    }

    coinIds = [...coinIds].reverse();

    console.log(`Processing ${coinIds.length} coins...`);
    for (const coinId of coinIds) {
      const exists = await coinExists(coinId);
      if (!exists) {
        await processCoinWithRetries(coinId);
        await wait(11000); // Wait 14 seconds if processed
      } else {
        console.log(
          `Skipping coin: ${coinId} (Already exists in the database)`
        );
      }
    }

    // Retry failed coins at the end
    console.log('Retrying failed coins...');
    for (const coinId of failedCoins) {
      await processCoinWithRetries(coinId);
    }
  } catch (error) {
    console.error('Error during processing:', error.message);
  } finally {
    console.log('Processing complete.');
    await pool.end();
  }
};

startProcessing();
