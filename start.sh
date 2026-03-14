#!/bin/bash
# Startup script for Railway / EC2 Deployment (Backend)

echo "Starting Backend API deployment..."

# If deploying from the root directory, we need to navigate to backend
if [ -d "backend" ]; then
    echo "Found backend directory, changing to it..."
    cd backend
fi

# Ensure requirements are installed (Railway does this automatically if a requirements.txt is at root)
# But just in case we are in a custom start script:
# pip install -r requirements.txt

# Start the FastAPI application with Uvicorn
# The app is located in app/main.py
python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
