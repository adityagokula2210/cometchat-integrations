# CometChat Integrations

A Node.js Express server for CometChat integrations with health monitoring.

## Getting Started

### Prerequisites

- Node.js (version 14.0.0 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the production server:

```bash
npm start
```

For development (with auto-restart):

```bash
npm run dev
```

The server will start on port 3000 by default (or the port specified in the PORT environment variable).

## API Endpoints

### Health Check
- **GET** `/health` - Returns server health status
  ```json
  {
    "status": "OK",
    "message": "CometChat Integrations server is running",
    "timestamp": "2025-10-04T12:00:00.000Z",
    "uptime": 42.123
  }
  ```

### Root
- **GET** `/` - Returns welcome message and available endpoints

## Project Structure

```
cometchat-integrations/
├── index.js          # Main Express server application
├── package.json      # Project configuration and dependencies
└── README.md         # This file
```

## Scripts

- `npm start` - Run the application
- `npm run dev` - Run in development mode
- `npm test` - Run tests (not yet implemented)

## License

ISC