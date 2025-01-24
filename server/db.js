// server/db.js (ES Module Syntax with Default Export)
import pg from 'pg'; // Import pg as a whole
const { Pool } = pg; // Destructure Pool from the imported module

import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  // host: 'localhost',
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

export default pool;
