#!/usr/bin/env python3
"""
Test script to validate environment variable loading
"""
import os
from dotenv import load_dotenv

def test_env_loading():
    """Test if environment variables are loaded correctly"""
    print("Testing environment variable loading...")
    
    # Load environment variables
    load_dotenv()
    
    # Test API_KEY loading
    api_key = os.getenv("API_KEY", "default-api-key")
    port = os.getenv("PORT", "8000")
    debug = os.getenv("DEBUG", "True")
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    
    print(f"API_KEY loaded: {api_key != 'default-api-key'}")
    print(f"API_KEY length: {len(api_key)}")
    print(f"API_KEY preview: {api_key[:8]}..." if len(api_key) > 8 else f"API_KEY: {api_key}")
    print(f"PORT: {port}")
    print(f"DEBUG: {debug}")
    print(f"CORS_ORIGINS: {cors_origins}")
    
    return api_key != "default-api-key"

if __name__ == "__main__":
    success = test_env_loading()
    if success:
        print("\n✅ Environment variables loaded successfully!")
    else:
        print("\n⚠️  API_KEY not found in environment. Create a .env file with API_KEY=your_key")
        print("   Copy env.example to .env and add your API key") 