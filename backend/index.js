const express = require('express');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Basic route to check server functionality
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Example route to handle a POST request
app.post('/data', (req, res) => {
  const data = req.body;
  res.send({ message: 'Data received successfully!', data });
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
