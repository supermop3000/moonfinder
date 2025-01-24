// routes/saveMarketDataRoute.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/', (req, res) => {
  const data = req.body;

  // Define the path for the JSON file
  const filePath = path.resolve('server/data', 'marketData.json');
  // Write the data to the file
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('Error saving data to file:', err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
    console.log('Data saved to marketData.json');
    return res.status(200).json({ message: 'Data saved successfully' });
  });
});

export default router;
