#!/usr/bin/env python3
"""
Test script for OMR Evaluation API
"""

import requests
import json
import time
from pathlib import Path

API_BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoints"""
    print("🔍 Testing health endpoints...")
    
    # Test basic health
    response = requests.get(f"{API_BASE_URL}/")
    print(f"GET /: {response.status_code} - {response.json()}")
    
    # Test detailed health
    response = requests.get(f"{API_BASE_URL}/health")
    print(f"GET /health: {response.status_code} - {response.json()}")

def test_omr_processing():
    """Test OMR processing with a sample image"""
    print("\n📊 Testing OMR processing...")
    
    # Create a simple test image (you would replace this with actual OMR sheet)
    from PIL import Image, ImageDraw
    import io
    
    # Create a simple test image
    img = Image.new('RGB', (800, 1000), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw some test bubbles
    for row in range(20):
        for col in range(5):
            x = 100 + col * 120
            y = 100 + row * 40
            
            # Draw circle (bubble)
            draw.ellipse([x, y, x+20, y+20], outline='black', width=2)
            
            # Fill some bubbles randomly
            if (row + col) % 3 == 0:
                draw.ellipse([x+2, y+2, x+18, y+18], fill='black')
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    # Test processing
    files = {'file': ('test_omr.png', img_bytes, 'image/png')}
    data = {
        'evaluation_mode': 'moderate',
        'student_id': 'test_student_001'
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/process-omr",
            files=files,
            data=data,
            timeout=30
        )
        
        print(f"POST /process-omr: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Processing successful!")
            print(f"   Student ID: {result['student_id']}")
            print(f"   Exam Version: {result['exam_version']}")
            print(f"   Total Score: {result['subject_scores']['total']}/100")
            print(f"   Processing Time: {result['processing_metadata']['processing_time_ms']}ms")
            print(f"   Bubbles Detected: {result['processing_metadata']['bubbles_detected']}")
            print(f"   Invalid Questions: {result['invalid_questions']}")
        else:
            print(f"❌ Processing failed: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

def test_results_endpoints():
    """Test results endpoints"""
    print("\n📋 Testing results endpoints...")
    
    try:
        # Get all results
        response = requests.get(f"{API_BASE_URL}/results?limit=10")
        print(f"GET /results: {response.status_code}")
        
        if response.status_code == 200:
            results = response.json()
            print(f"   Found {len(results['results'])} results")
        
        # Get specific student results
        response = requests.get(f"{API_BASE_URL}/results/test_student_001")
        print(f"GET /results/test_student_001: {response.status_code}")
        
        if response.status_code == 200:
            student_results = response.json()
            print(f"   Student has {len(student_results['results'])} results")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

def main():
    """Run all tests"""
    print("🚀 OMR Evaluation API Test Suite")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    try:
        test_health()
        test_omr_processing()
        test_results_endpoints()
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")

if __name__ == "__main__":
    main()
