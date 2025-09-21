// Node.js script to test the backend API call
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testBackendAPI() {
  const API_BASE_URL = 'http://localhost:8000';
  
  try {
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log('Health check result:', health);
    
    console.log('2. Testing OMR processing...');
    const formData = new FormData();
    
    // Use the test image we created
    const imageBuffer = fs.readFileSync('backend/test_omr_simple.png');
    formData.append('file', imageBuffer, {
      filename: 'test_omr_simple.png',
      contentType: 'image/png'
    });
    formData.append('evaluation_mode', 'moderate');
    formData.append('student_id', 'test123');
    
    const omrResponse = await fetch(`${API_BASE_URL}/process-omr`, {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': 'http://localhost:8080'
      }
    });
    
    const omrResult = await omrResponse.json();
    console.log('OMR processing result:');
    console.log('- Success:', omrResult.success);
    console.log('- Student ID:', omrResult.student_id);
    console.log('- Bubbles detected:', omrResult.bubble_detections?.length || 0);
    console.log('- Subject scores:', omrResult.subject_scores);
    console.log('- Invalid questions:', omrResult.invalid_questions);
    
    if (omrResult.bubble_detections && omrResult.bubble_detections.length > 0) {
      console.log('- First few bubble detections:');
      omrResult.bubble_detections.slice(0, 3).forEach((detection, i) => {
        console.log(`  ${i + 1}. Q${detection.question_number}${detection.bubble_letter}: filled=${detection.is_filled}, confidence=${detection.confidence}`);
      });
    }
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testBackendAPI();
