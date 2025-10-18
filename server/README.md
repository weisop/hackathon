# Hackathon Server

Express.js server with Supabase authentication for the hackathon project.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   npm run setup
   ```

3. Configure your `.env` file with your Supabase credentials:
   ```
   PORT=3001
   NODE_ENV=development
   SUPABASE_URL=your-supabase-url-here
   SUPABASE_ANON_KEY=your-supabase-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
   JWT_SECRET=your-jwt-secret-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The server will run on http://localhost:3001

6. Test the server setup:
   ```bash
   npm test
   ```

## API Endpoints

### Health & Status
- `GET /api/health` - Health check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)

### Items (Todo-like functionality)
- `GET /api/items` - Get all items (optional auth)
- `GET /api/items/:id` - Get specific item
- `POST /api/items` - Create new item (requires auth)
- `PUT /api/items/:id` - Update item (requires auth)
- `DELETE /api/items/:id` - Delete item (requires auth)

## Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Get your project URL and anon key from the project settings
3. Create a `profiles` table in your Supabase database:
   ```sql
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     full_name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
4. Enable Row Level Security (RLS) on the profiles table
5. Add the environment variables to your `.env` file

## Development

- The server uses in-memory storage for items (not persistent)
- Authentication is handled through Supabase
- CORS is enabled for cross-origin requests
- JWT tokens are validated through Supabase auth
