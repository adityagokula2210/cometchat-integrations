// Temporary bridge for deployment - PM2 restart required// DEPRECATED: Use app.js instead

// This ensures the server stays up while PM2 config is updatedrequire("./app.js");

console.log('🔄 Temporary bridge: Loading app.js...');
require('./app.js');