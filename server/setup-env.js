const fs = require('fs');
const path = require('path');

const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# JWT Secret (for additional security if needed)
JWT_SECRET=your-jwt-secret-here
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 Please update the Supabase credentials in .env file');
} else {
  console.log('⚠️  .env file already exists, skipping creation');
}
