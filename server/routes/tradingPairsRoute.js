import express from 'express';
import pg from 'pg';
import pool from '../db.js';

const router = express.Router();

// Route to fetch trading pairs for a specific asset
router.get('/:assetId', async (req, res) => {
  const { assetId } = req.params;

  try {
    // Query to fetch symbol from asset_map
    const symbolQuery = `
      SELECT asset_map ->> $1 AS symbol
      FROM exchange_info
      WHERE id = 1
    `;
    const symbolResult = await pool.query(symbolQuery, [assetId]);
    // console.log(symbolResult);

    // If no symbol is found, return 404
    if (symbolResult.rows.length === 0 || !symbolResult.rows[0].symbol) {
      return res
        .status(404)
        .json({ error: `Symbol not found for asset_id: ${assetId}` });
    }

    const symbol = symbolResult.rows[0].symbol;

    const exchange_id = 1;

    // Query to fetch trading pairs for the symbol
    const tradingPairsQuery = `
      SELECT base_asset, quote_asset, symbol, last_price, volume, quote_volume
      FROM coin_price_history
      WHERE base_asset = $1
        AND exchange_id = $2
      ORDER BY recorded_at DESC
      LIMIT 50;
    `;
    const tradingPairsResult = await pool.query(tradingPairsQuery, [
      symbol,
      exchange_id,
    ]);

    res.json(tradingPairsResult.rows);
  } catch (error) {
    console.error('Error fetching trading pairs:', error.message);
    res.status(500).json({ error: 'Failed to fetch trading pairs' });
  }
});

export default router;
