/**
 * Legacy Entry Point - Bridge to New Architecture
 * This file maintains backward compatibility while delegating to the new app.js
 * 
 * IMPORTANT: This is a compatibility bridge. The main application is now in app.js
 * with the new service architecture (controllers, services, middleware, etc.)
 */

console.log('� Loading new service architecture from app.js...');

// Simply require and start the new architecture
require('./app.js');