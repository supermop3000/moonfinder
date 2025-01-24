const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic route to display text
app.get('/', (req, res) => {
  res.send('Hello, World from Moon Finder! We love tree lined streets!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running locally at https://localhost:${PORT}`);
});
