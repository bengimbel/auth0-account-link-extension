const path = require('path');
const { FileStorageContext, WebtaskStorageContext } = require('auth0-extension-tools');
const config = require('../lib/config');
const createServer = require('./index');
const logger = require('../lib/logger');
const initStorage = require('../lib/db').init;

const initServer = async (cfg, storageContext) => {
  try {
    // Set configuration provider.
    config.setProvider(key => cfg(key) || process.env[key]);

    // Initialize the storage context
    initStorage(
      storageContext
        ? new WebtaskStorageContext(storageContext, { force: 1 })
        : new FileStorageContext(path.join(__dirname, '../data.json'))
    );
    // Start the server.
    await createServer();
    logger.info('Hapi initialization completed.');
  } catch (error) {
    logger.error('Hapi initialization failed.');
    logger.error(error);

    throw error;
  }
};

module.exports = initServer;
