#!/bin/bash

echo "🚀 Starting Full-Stack Web App..."
echo

echo "📦 Installing dependencies..."
npm run install:all

echo
echo "🔥 Starting development servers..."
echo "Client: http://localhost:5173"
echo "Server: http://localhost:3001"
echo

npm run dev
