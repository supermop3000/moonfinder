import express from 'express';
import pool from '../db.js'; // Import the DB connection
import path from 'path';
import createHootfolioIdenticon from '../services/createHootfolioIdenticon.js';
import fs from 'fs';

const router = express.Router();

router.get('/:hootfolioId/history', async (req, res) => {
  console.log('FETCHING HOOTFOLIO VALUE HISTORY');

  const hootfolioId = req.params.hootfolioId;

  if (!hootfolioId) {
    return res.status(400).json({ message: 'Hootfolio ID is required' });
  }

  try {
    const query = `
      SELECT timestamp, total_value 
      FROM hootfolio_value_history
      WHERE hootfolio_id = $1
      ORDER BY timestamp ASC
    `;
    const result = await pool.query(query, [hootfolioId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'No data found for the specified range' });
    }

    res.status(200).json({ values: result.rows });
  } catch (error) {
    console.error('Error fetching value history:', error);
    res.status(500).json({ message: 'Error fetching value history' });
  }
});

// GET HOOTFOLIO IDENTICON
router.get('/identicons/:username', async (req, res) => {
  const { username } = req.params; // Get the username (used to generate the identicon)
  console.log(`Requesting identicon for username: ${username}`);

  console.log(process.env.NODE_ENV);

  // Define the path to the identicon SVG file
  let identiconDir = path.join(process.cwd(), 'public', 'identicons');

  // Check if we're in development or production and adjust the path accordingly
  if (process.env.NODE_ENV === 'development') {
    // In production, use the correct path
    identiconDir = path.join(process.cwd(), 'server', 'public', 'identicons');
  }

  const identiconPath = path.join(identiconDir, `${username}.svg`);

  // Log the full path
  console.log(`Looking for identicon at: ${identiconPath}`);

  // Check if the identicon file exists
  if (!fs.existsSync(identiconPath)) {
    // If not, generate the identicon
    console.log('Identicon not found. Generating...');
    try {
      createHootfolioIdenticon(username); // Call your function to generate the identicon
    } catch (error) {
      console.error('Error creating identicon:', error);
      return res.status(500).json({ message: 'Error creating identicon' });
    }
  }

  // After ensuring the image exists, send it to the client
  res.sendFile(identiconPath, (err) => {
    if (err) {
      console.error('File not found or error serving file:', err);
      return res.status(404).json({ message: 'Image not found' });
    }
  });
});

// ADD HOOTFOLIO ASSET
router.post('/add-asset', async (req, res) => {
  console.log('ADDING ASSET TO HOOTFOLIO IN DB');
  const { hootfolioId, assetId, name, balance, symbol, image, marketPrice } =
    req.body;

  console.log('Incoming Asset Data:');
  console.log('hootfolioId:', hootfolioId);
  console.log('assetId:', assetId);
  console.log('name:', name);
  console.log('balance:', balance);
  console.log('symbol:', symbol);
  console.log('image:', image);
  console.log('marketPrice:', marketPrice);

  if (!hootfolioId || !assetId || balance === undefined) {
    return res
      .status(400)
      .json({ message: 'Hootfolio ID, Asset ID, and Balance are required' });
  }

  try {
    // Check if the asset already exists for the given hootfolio ID
    const existingAsset = await pool.query(
      'SELECT balance FROM hootfolio_assets WHERE hootfolio_id = $1 AND asset_id = $2',
      [hootfolioId, assetId]
    );

    if (existingAsset.rows.length > 0) {
      console.log('EXISTING ASSET NEED TO UPDATE');
      // Asset exists, update the balance
      const newBalance =
        Number(existingAsset.rows[0].balance) + Number(balance);

      const updatedAsset = await pool.query(
        'UPDATE hootfolio_assets SET balance = $1 WHERE hootfolio_id = $2 AND asset_id = $3 RETURNING *',
        [newBalance, hootfolioId, assetId]
      );

      res.status(200).json({
        message: 'Asset balance updated successfully',
        asset: updatedAsset.rows[0],
      });
    } else {
      // Asset does not exist, insert it
      const result = await pool.query(
        'INSERT INTO hootfolio_assets (hootfolio_id, asset_id, name, balance, symbol, image, market_price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [hootfolioId, assetId, name, balance, symbol, image, marketPrice]
      );

      res
        .status(201)
        .json({ message: 'Asset added successfully', asset: result.rows[0] });
    }
  } catch (error) {
    console.error('Error adding or updating asset:', error);
    res.status(500).json({ message: 'Error adding or updating asset' });
  }
});

// SWAP HOOTFOLIO ASSETS
router.post('/swap', async (req, res) => {
  console.log('PROCESSING SWAP IN HOOTFOLIO');
  const { hootfolioId, swapDate, sentAsset, receivedAsset } = req.body;

  console.log('Incoming Swap Data:');
  console.log('hootfolioId:', hootfolioId);
  console.log('swapDate:', swapDate);
  console.log('sentAsset:', sentAsset);
  console.log('receivedAsset:', receivedAsset);

  if (!hootfolioId || !sentAsset || !receivedAsset) {
    return res.status(400).json({
      message: 'Hootfolio ID, sent asset, and received asset are required',
    });
  }

  const client = await pool.connect();

  try {
    // Start a database transaction
    await client.query('BEGIN');

    // Handle sent asset (subtract balance)
    const existingSentAsset = await client.query(
      'SELECT balance FROM hootfolio_assets WHERE hootfolio_id = $1 AND asset_id = $2',
      [hootfolioId, sentAsset.assetId]
    );

    if (existingSentAsset.rows.length > 0) {
      console.log('EXISTING SENT ASSET NEED TO UPDATE');

      // Update the balance of the sent asset
      const newSentBalance =
        Number(existingSentAsset.rows[0].balance) + Number(sentAsset.balance); // Subtract (negative balance)
      if (newSentBalance < 0) {
        throw new Error(`Insufficient balance for ${sentAsset.name}`);
      }

      await client.query(
        'UPDATE hootfolio_assets SET balance = $1 WHERE hootfolio_id = $2 AND asset_id = $3',
        [newSentBalance, hootfolioId, sentAsset.assetId]
      );
    } else {
      throw new Error(
        `Sent asset ${sentAsset.name} does not exist in the hootfolio`
      );
    }

    // Handle received asset (add balance)
    const existingReceivedAsset = await client.query(
      'SELECT balance FROM hootfolio_assets WHERE hootfolio_id = $1 AND asset_id = $2',
      [hootfolioId, receivedAsset.assetId]
    );

    if (existingReceivedAsset.rows.length > 0) {
      console.log('EXISTING RECEIVED ASSET NEED TO UPDATE');

      // Update the balance of the received asset
      const newReceivedBalance =
        Number(existingReceivedAsset.rows[0].balance) +
        Number(receivedAsset.balance);

      await client.query(
        'UPDATE hootfolio_assets SET balance = $1 WHERE hootfolio_id = $2 AND asset_id = $3',
        [newReceivedBalance, hootfolioId, receivedAsset.assetId]
      );
    } else {
      console.log('ADDING NEW RECEIVED ASSET');

      // Insert the received asset if it doesn't exist
      await client.query(
        'INSERT INTO hootfolio_assets (hootfolio_id, asset_id, name, balance, symbol, image, market_price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          hootfolioId,
          receivedAsset.assetId,
          receivedAsset.name,
          receivedAsset.balance,
          receivedAsset.symbol,
          receivedAsset.image,
          receivedAsset.marketPrice,
        ]
      );
    }

    // Commit the transaction
    await client.query('COMMIT');
    res.status(200).json({ message: 'Swap processed successfully' });
  } catch (error) {
    // Roll back the transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Error processing swap:', error);
    res
      .status(500)
      .json({ message: `Error processing swap: ${error.message}` });
  } finally {
    client.release();
  }
});

// DELETE HOOTFOLIO ASSET
router.delete('/delete-asset', async (req, res) => {
  console.log('DELETING ASSET FROM DB');

  const { assetId, hootfolioId } = req.body;

  if (!assetId || !hootfolioId) {
    return res
      .status(400)
      .json({ message: 'Asset ID and Hootfolio ID are required' });
  }

  try {
    // Delete the asset from the hootfolio_assets table where both assetId and hootfolioId match
    const result = await pool.query(
      'DELETE FROM hootfolio_assets WHERE asset_id = $1 AND hootfolio_id = $2 RETURNING *',
      [assetId, hootfolioId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'Asset not found or already deleted' });
    }

    res.status(200).json({
      message: 'Asset deleted successfully',
      deletedAsset: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Error deleting asset' });
  }
});

// UPDATE HOOTFOLIO ASSET
router.put('/update-asset', async (req, res) => {
  console.log('UPDATING ASSET VALUE IN DB');
  const { assetId, balance, hootfolioId } = req.body;

  if (!assetId || balance === undefined) {
    return res
      .status(400)
      .json({ message: 'Asset ID and balance are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE hootfolio_assets SET balance = $1 WHERE hootfolio_id = $2 AND asset_id = $3 RETURNING *',
      [balance, hootfolioId, assetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ message: 'Error updating balance' });
  }
});

// UPDATE HOOTFOLIO
router.put('/update-hootfolio', async (req, res) => {
  console.log('UPDATING HOOTFOLIO VALUE IN DB');
  const { hootfolioId, hootfolioName } = req.body; // Match the client payload

  if (!hootfolioId || hootfolioName === undefined) {
    return res
      .status(400)
      .json({ message: 'Hootfolio ID and name are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE hootfolios SET name = $1 WHERE id = $2 RETURNING *',
      [hootfolioName, hootfolioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hootfolio not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating hootfolio:', error);
    res.status(500).json({ message: 'Error updating hootfolio' });
  }
});

// UPDATE SORT ORDER
router.put('/update-hootfolio-asset-sorts', async (req, res) => {
  console.log('UPDATING HOOTFOLIO ASSET SORTING');
  const { updatedOrder } = req.body; // Expecting an array of { id, sort_order }
  console.log(updatedOrder);
  if (!Array.isArray(updatedOrder)) {
    return res
      .status(400)
      .json({ message: 'Invalid request: updatedOrder must be an array' });
  }

  try {
    const queries = updatedOrder.map(({ id, sort_order }) =>
      pool.query(
        'UPDATE hootfolio_assets SET sort_order = $1 WHERE id = $2 RETURNING *',
        [sort_order, id]
      )
    );

    const results = await Promise.all(queries);

    res.status(200).json(results.map((result) => result.rows[0])); // Return updated rows
  } catch (error) {
    console.error('Error updating hootfolio asset sorts:', error);
    res.status(500).json({ message: 'Error updating hootfolio asset sorts' });
  }
});

// UPDATE VISIBILITY SETTING
router.put('/update-hootfolio-values-visible', async (req, res) => {
  console.log('UPDATING HOOTFOLIO VISIBILITY');
  const { hootfolioId, valuesVisible } = req.body;

  if (!hootfolioId === undefined || valuesVisible === undefined) {
    return res
      .status(400)
      .json({ message: 'Hootfolio ID and values visible variable required' });
  }

  try {
    const result = await pool.query(
      'UPDATE hootfolios SET values_visible = $1 WHERE id = $2 RETURNING *',
      [valuesVisible, hootfolioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hootfolio not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating hootfolio:', error);
    res.status(500).json({ message: 'Error updating hootfolio' });
  }
});

// GENERATE NEW HOOTFOLIO NAME
router.put('/generate-hootfolio-name', async (req, res) => {
  console.log('GENERATING NEW HOOTFOLIO NAME');
  const { hootfolioId } = req.body;

  if (!hootfolioId === undefined) {
    return res.status(400).json({ message: 'Hootfolio ID required' });
  }

  const funName = generateFunName();

  try {
    const result = await pool.query(
      'UPDATE hootfolios SET name = $1 WHERE id = $2 RETURNING *',
      [funName, hootfolioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hootfolio not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating hootfolio:', error);
    res.status(500).json({ message: 'Error updating hootfolio' });
  }
});

const generateFunName = () => {
  const adjectives = [
    'Groovy',
    'Sizzling',
    'Bright',
    'Sneaky',
    'Lucky',
    'Wise',
    'Chill',
    'Weezy',
    'Sparkling',
    'Dancing',
    'Huggy',
  ];
  const nouns = [
    'Woofer',
    'Cheetah',
    'Orangutan',
    'Panda',
    'Rain',
    'Potato',
    'Cactus',
    'Cheesecake',
    'Unicorn',
    'Moon',
    'T-Rex',
    'Fire',
    'Dragon',
    'Owl',
    'Mammoth',
    'Monster',
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
};

// GET HOOTFOLIO BY USER ID
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('GETTING HOOTFOLIOS FOR USER');

  try {
    // Query the database for the user's hootfolio based on the userId
    const result = await pool.query(
      'SELECT * FROM hootfolios WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      // No hootfolio found, create one
      const funName = generateFunName();
      const insertResult = await pool.query(
        'INSERT INTO hootfolios (user_id, name) VALUES ($1, $2) RETURNING *',
        [userId, funName]
      );
      console.log(`CREATING HOOTFOLIO, "${funName}", FOR USER ${userId}`);

      return res.status(201).json({ hootfolio: insertResult.rows });
    }

    // Return the existing hootfolio
    res.status(200).json({ hootfolio: result.rows });
  } catch (error) {
    console.error('Error fetching or creating hootfolio:', error);
    res.status(500).json({ message: 'Error fetching or creating hootfolio' });
  }
});

// GET HOOTFOLIO ASSETS
router.get('/:hootfolioId/assets', async (req, res) => {
  const hootfolioId = req.params.hootfolioId;
  console.log('GETTING HOOTFOLIO ASSETS FROM DB');

  if (!hootfolioId) {
    return res.status(400).json({ message: 'Hootfolio ID is required' });
  }

  try {
    // Query the hootfolio_assets table to get all assets related to the hootfolio
    // ID IS HARDCODED RIGHT NOW
    const result = await pool.query(
      'SELECT * FROM hootfolio_assets WHERE hootfolio_id = $1',
      [hootfolioId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'No assets found for this hootfolio' });
    }

    res.status(200).json({ assets: result.rows });
  } catch (error) {
    console.error('Error fetching assets for hootfolio:', error);
    res.status(500).json({ message: 'Error fetching assets for hootfolio' });
  }
});

// Export the router once at the end
export default router;
