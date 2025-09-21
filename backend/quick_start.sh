#!/bin/bash

# OMR Evaluation Backend Quick Start Script

echo "🚀 OMR Evaluation Backend Quick Start"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

echo "✅ Python and pip are available"

# Install dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads outputs logs data

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating environment file..."
    cp env.example .env
    echo "📝 Please edit .env file with your database settings"
fi

# Check if PostgreSQL is running (optional)
if command -v psql &> /dev/null; then
    echo "🐘 Checking PostgreSQL connection..."
    if psql -h localhost -U postgres -c "SELECT 1;" &> /dev/null; then
        echo "✅ PostgreSQL is running"
    else
        echo "⚠️  PostgreSQL is not running or not accessible"
        echo "   Please start PostgreSQL or update .env with correct settings"
    fi
else
    echo "⚠️  PostgreSQL client not found. Please install PostgreSQL"
fi

# Make scripts executable
chmod +x start.py test_api.py

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database settings"
echo "2. Start the backend: python3 start.py"
echo "3. Test the API: python3 test_api.py"
echo ""
echo "The API will be available at: http://localhost:8000"
echo "API documentation: http://localhost:8000/docs"
echo ""
