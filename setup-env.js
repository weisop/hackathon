#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for web-app...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, 'client', '.env.local');
const envExamplePath = path.join(__dirname, 'client', 'env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
} else {
  console.log('📝 Creating .env.local from template...');
  
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file');
  } else {
    // Create basic .env.local
    const basicEnv = `# Supabase Configuration
# Replace with your actual Supabase project credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_URL=http://localhost:3001
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Created basic .env.local file');
  }
}

console.log('\n📋 Next steps:');
console.log('1. Edit client/.env.local with your Supabase credentials');
console.log('2. Get your Supabase URL and anon key from https://supabase.com');
console.log('3. Restart the development server');
console.log('\n🚀 Run: npm run dev');
