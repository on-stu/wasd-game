#!/bin/bash

echo "🎮 Setting up WASD Game..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please review and update the configuration."
fi

# Create dist directories
echo "📁 Creating build directories..."
mkdir -p server/dist
mkdir -p dist/client

echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
echo "🏗️  To build for production:"
echo "   npm run build"
echo ""
echo "🎯 To start production server:"
echo "   npm start"
echo ""
echo "📝 Don't forget to:"
echo "   1. Review the .env file"
echo "   2. Create your game assets in client/src/assets/"
echo "   3. Customize the game mechanics in client/src/game/"
