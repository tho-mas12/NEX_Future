import sys
import os

# Add backend directory to sys.path so app modules can be loaded
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Vercel Serverless Function entry point
# FastAPI ASGI application is natively supported by Vercel's Python runtime
