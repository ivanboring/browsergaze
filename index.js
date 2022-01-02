const fs = require('fs');

// Check that it's installed
if (!fs.existsSync('config.yaml')) {
    console.log('Please install first, run npm run install');
    process.exit(1);
}

// Check that all requirements are set.
require('./src/services/initialize').init();

// Start server.
require('./src/server').start();