const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test the media analysis endpoint directly
async function testMediaAnalysis() {
    console.log('🔍 Testing Media Analysis Endpoint...');
    
    try {
        // First, let's check if we can access the endpoint
        const response = await fetch('http://localhost:5000/health');
        if (!response.ok) {
            console.log('❌ Server not responding');
            return;
        }
        console.log('✅ Server is running');
        
        // Create a simple test image
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 10, 10);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', blob, 'test.png');
        formData.append('prompt', 'Analyze this test image');
        
        console.log('📤 Sending file to server...');
        
        // Send request
        const analysisResponse = await fetch('http://localhost:5000/api/gemini/analyze-file', {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Response status:', analysisResponse.status);
        
        if (analysisResponse.ok) {
            const result = await analysisResponse.json();
            console.log('✅ Analysis successful:', result);
        } else {
            const error = await analysisResponse.text();
            console.log('❌ Analysis failed:', error);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Test authentication
async function testAuth() {
    console.log('🔐 Testing Authentication...');
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/verify', {
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        
        console.log('Auth response status:', response.status);
        const result = await response.text();
        console.log('Auth result:', result);
        
    } catch (error) {
        console.log('Auth error:', error.message);
    }
}

// Test file upload directory
function testUploadDirectory() {
    console.log('📁 Testing Upload Directory...');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log('Uploads directory path:', uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
        console.log('❌ Uploads directory does not exist');
        try {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Created uploads directory');
        } catch (error) {
            console.log('❌ Failed to create uploads directory:', error.message);
        }
    } else {
        console.log('✅ Uploads directory exists');
    }
}

// Test Gemini service
async function testGeminiService() {
    console.log('🤖 Testing Gemini Service...');
    
    try {
        const { GeminiService } = require('./server/services/gemini');
        
        // Test if the service can be imported
        console.log('✅ GeminiService imported successfully');
        
        // Check if API key is available
        const hasKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0;
        console.log('🔑 Gemini API Key available:', hasKey);
        
    } catch (error) {
        console.log('❌ GeminiService error:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Media Analysis Debug Tests...\n');
    
    testUploadDirectory();
    console.log('');
    
    await testAuth();
    console.log('');
    
    await testGeminiService();
    console.log('');
    
    await testMediaAnalysis();
    console.log('');
    
    console.log('🏁 Debug tests completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = { testMediaAnalysis, testAuth, testGeminiService, testUploadDirectory }; 