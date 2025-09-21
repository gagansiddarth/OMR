#!/usr/bin/env python3
"""
Railway deployment entry point for OMR Backend
This file redirects to the backend directory
"""

import os
import sys
import subprocess

# Change to backend directory
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
os.chdir(backend_dir)

# Add backend to Python path
sys.path.insert(0, backend_dir)

# Import and run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    from main import app
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
