import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';
import pg from 'pg';
import pgFormat from 'pg-format';

dotenv.config();

const BASE_URL = 'https://api.binance.us';
const EXCHANGE_ID = 1; // Replace with your actual exchange_id value from exchange_info

const { Pool } = pg;
const pool = new Pool({
  host: '3.23.66.181',
  user: 'moonfinderpg',
  password: 'moon',
  database: 'moonfinder_db',
  port: 5432,
});

// Batch insert trading pair price history
const insertBatchPriceHistory = async (priceHistory) => {
  const query = `
    INSERT INTO coin_price_history (
      exchange_id, asset_id, base_asset, quote_asset, symbol, price_change, price_change_percent, 
      weighted_avg_price, prev_close_price, last_price, last_qty, bid_price, bid_qty, ask_price, 
      ask_qty, open_price, high_price, low_price, volume, quote_volume, open_time, close_time, 
      first_id, last_id, count, recorded_at
    )
    VALUES %L;
  `;

  try {
    console.log('Preparing to insert price history...');
    const formattedQuery = pgFormat(
      query,
      priceHistory.map((pair) => [
        EXCHANGE_ID,
        pair.asset_id,
        pair.base_asset,
        pair.quote_asset,
        pair.symbol,
        pair.price_change,
        pair.price_change_percent,
        pair.weighted_avg_price,
        pair.prev_close_price,
        pair.last_price,
        pair.last_qty,
        pair.bid_price,
        pair.bid_qty,
        pair.ask_price,
        pair.ask_qty,
        pair.open_price,
        pair.high_price,
        pair.low_price,
        pair.volume,
        pair.quote_volume,
        new Date(pair.open_time),
        new Date(pair.close_time),
        pair.first_id,
        pair.last_id,
        pair.count,
        new Date(), // Use the current timestamp for recorded_at
      ])
    );

    await pool.query(formattedQuery);
    console.log(`Successfully inserted ${priceHistory.length} trading pairs.`);
  } catch (error) {
    console.error('Error inserting batch price history:', error.message);
    console.error('Failed batch:', priceHistory);
  }
};

// if last_price is 0 and last_qty is 0, and bid price is 0 and volume is 0 and high_price and low_price are 0 don't add the field to the DB

// Fetch exchange info to extract `baseAsset` and `quoteAsset`
const fetchExchangeInfo = async () => {
  try {
    console.log('Fetching exchange info from Binance...');
    const response = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`);
    const { symbols } = response.data;

    // Map symbols to their respective base and quote assets
    const assetMap = symbols.reduce((map, symbolInfo) => {
      map[symbolInfo.symbol] = {
        baseAsset: symbolInfo.baseAsset,
        quoteAsset: symbolInfo.quoteAsset,
      };
      return map;
    }, {});

    console.log('Exchange info fetched successfully.');
    return assetMap;
  } catch (error) {
    console.error('Error fetching exchange info:', error.message);
    throw error;
  }
};

// Fetch trading data from Binance
const fetchTradingData = async () => {
  try {
    console.log('Fetching trading data from Binance...');
    const response = await axios.get(`${BASE_URL}/api/v3/ticker/24hr`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trading pairs:', error.message);
    throw error;
  }
};

// Main function to process trading pairs
const fetchAndProcessTradingPairs = async () => {
  try {
    const tradingData = await fetchTradingData();
    const assetMap = await fetchExchangeInfo();

    console.log(`Processing ${tradingData.length} trading pairs.`);
    const filteredData = tradingData
      .filter((pair) => {
        // Skip pairs where all these fields are 0
        return !(
          parseFloat(pair.lastPrice) === 0 &&
          parseFloat(pair.lastQty) === 0 &&
          parseFloat(pair.bidPrice) === 0 &&
          parseFloat(pair.volume) === 0 &&
          parseFloat(pair.highPrice) === 0 &&
          parseFloat(pair.lowPrice) === 0
        );
      })
      .map((pair) => {
        const assets = assetMap[pair.symbol] || {
          baseAsset: null,
          quoteAsset: null,
        };
        return {
          asset_id: pair.symbol.split('/')[0] || null, // Example logic for asset ID
          base_asset: assets.baseAsset,
          quote_asset: assets.quoteAsset,
          symbol: pair.symbol,
          price_change: parseFloat(pair.priceChange),
          price_change_percent: parseFloat(pair.priceChangePercent),
          weighted_avg_price: parseFloat(pair.weightedAvgPrice),
          prev_close_price: parseFloat(pair.prevClosePrice),
          last_price: parseFloat(pair.lastPrice),
          last_qty: parseFloat(pair.lastQty),
          bid_price: parseFloat(pair.bidPrice),
          bid_qty: parseFloat(pair.bidQty),
          ask_price: parseFloat(pair.askPrice),
          ask_qty: parseFloat(pair.askQty),
          open_price: parseFloat(pair.openPrice),
          high_price: parseFloat(pair.highPrice),
          low_price: parseFloat(pair.lowPrice),
          volume: parseFloat(pair.volume),
          quote_volume: parseFloat(pair.quoteVolume),
          open_time: pair.openTime,
          close_time: pair.closeTime,
          first_id: pair.firstId,
          last_id: pair.lastId,
          count: pair.count,
        };
      });

    console.log(`Filtered down to ${filteredData.length} trading pairs.`);
    await insertBatchPriceHistory(filteredData);
  } catch (error) {
    console.error('Error in fetchAndProcessTradingPairs:', error.message);
  }
};

// Initial fetch and process
await fetchAndProcessTradingPairs();

// Schedule periodic fetch and process every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('Fetching and processing all trading pairs...');
  await fetchAndProcessTradingPairs();
});
