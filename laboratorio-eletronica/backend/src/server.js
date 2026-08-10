require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module && !process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`API do Laboratório de Eletrônica rodando em http://localhost:${config.port}`);
  });
}

module.exports = app;
