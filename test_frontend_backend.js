// Test script to verify frontend-backend communication
const API_BASE_URL = 'http://localhost:8000';

async function testBackendAPI() {
  console.log('Testing backend API from frontend perspective...');
  
  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:8080',
        'Content-Type': 'application/json'
      }
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
    
    const health = await healthResponse.json();
    console.log('Health check result:', health);
    
    // Test OMR processing
    console.log('2. Testing OMR processing...');
    const formData = new FormData();
    
    // Create a simple test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(50, 50, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    canvas.toBlob(async (blob) => {
      formData.append('file', blob, 'test.png');
      formData.append('evaluation_mode', 'moderate');
      formData.append('student_id', 'test123');
      
      const omrResponse = await fetch(`${API_BASE_URL}/process-omr`, {
        method: 'POST',
        headers: {
          'Origin': 'http://localhost:8080'
        },
        body: formData
      });
      
      if (!omrResponse.ok) {
        throw new Error(`OMR processing failed: ${omrResponse.status} ${omrResponse.statusText}`);
      }
      
      const omrResult = await omrResponse.json();
      console.log('OMR processing result:', omrResult);
      console.log('Success:', omrResult.success);
      console.log('Bubbles detected:', omrResult.bubble_detections?.length || 0);
      
    }, 'image/png');
    
  } catch (error) {
    console.error('Backend API test failed:', error);
  }
}

// Run the test
testBackendAPI();
