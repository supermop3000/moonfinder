import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

// Emulate __dirname for ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Import routes
import hootfolioRoutes from './routes/HootfolioRoutes.js';
import userAuthRoute from './routes/userAuthRoute.js';
import liveCoinDataRoute from './routes/liveCoinDataRoute.js';
import historicalCoinDataRoute from './routes/historicalCoinDataRoute.js';
import hootfolioAssetDataRoute from './routes/hootfolioAssetDataRoute.js';
import saveMarketDataRoute from './routes/saveMarketDataRoute.js';
import tradingPairsRoute from './routes/tradingPairsRoute.js';
import documentRoutes from './routes/documenterRoute.js';

// CORS Configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? 'https://moonfinder.org'
      : 'https://localhost:3001',
};
app.use(cors(corsOptions));

// API routes
app.use('/api/auth', userAuthRoute);
app.use('/api/live', liveCoinDataRoute);
app.use('/api/historical', historicalCoinDataRoute);
app.use('/api/hootfolioAssetData', hootfolioAssetDataRoute);
app.use('/api/saveMarketData', saveMarketDataRoute);
app.use('/api/hootfolio', hootfolioRoutes);
app.use('/api/trading-pairs', tradingPairsRoute);
app.use('/api', documentRoutes);

// Serve static files and React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // Development fallback
  app.get('*', (req, res) => {
    res
      .status(404)
      .send('API route not found, and React build directory is missing.');
  });
}

// HTTPS for Development
if (process.env.NODE_ENV === 'development') {
  try {
    const sslOptions = {
      key: fs.readFileSync(path.resolve(process.env.SSL_KEY_FILE)),
      cert: fs.readFileSync(path.resolve(process.env.SSL_CRT_FILE)),
    };

    https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`Secure server running on https://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(
      'Failed to start HTTPS server in development mode:',
      err.message
    );
    console.log(`Falling back to HTTP on http://localhost:${PORT}`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// HTTP for Production
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

console.log(`Server running in ${process.env.NODE_ENV} mode`);
