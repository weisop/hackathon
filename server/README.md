# Server

Express.js server for the full-stack web application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The server will run on http://localhost:3001

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get specific item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Environment Variables

Create a `.env` file in the server directory with:

```
PORT=3001
NODE_ENV=development
```
