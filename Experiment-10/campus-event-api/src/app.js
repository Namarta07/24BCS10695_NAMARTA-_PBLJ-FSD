const express = require('express');
const registrationRoutes = require('./routes/registrationRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.use('/api/registrations', registrationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
