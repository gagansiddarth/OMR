#!/usr/bin/env python3
"""
Startup script for OMR Evaluation Backend
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from config.settings import get_settings

def main():
    """Start the FastAPI server"""
    settings = get_settings()
    
    print("🚀 Starting OMR Evaluation Backend...")
    print(f"📊 Database: {settings.database_url}")
    print(f"🌐 Server: http://{settings.api_host}:{settings.api_port}")
    print(f"📁 Upload Directory: {settings.upload_dir}")
    print(f"📁 Output Directory: {settings.output_dir}")
    
    # Ensure directories exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.output_dir, exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )

if __name__ == "__main__":
    main()
