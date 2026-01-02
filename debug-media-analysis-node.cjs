const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
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
        
        // Create a simple test image file
        const testImagePath = path.join(__dirname, 'test-image.png');
        
        // Create a minimal PNG file (1x1 pixel)
        const pngData = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
            0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x00, 0x01, // width: 1
            0x00, 0x00, 0x00, 0x01, // height: 1
            0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
            0x90, 0x77, 0x53, 0xDE, // CRC
            0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
            0x49, 0x44, 0x41, 0x54, // IDAT
            0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
            0xE2, 0x21, 0xBC, 0x33, // CRC
            0x00, 0x00, 0x00, 0x00, // IEND chunk length
            0x49, 0x45, 0x4E, 0x44, // IEND
            0xAE, 0x42, 0x60, 0x82  // CRC
        ]);
        
        fs.writeFileSync(testImagePath, pngData);
        console.log('✅ Created test image file');
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath), 'test.png');
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
            console.log('✅ Analysis successful:', JSON.stringify(result, null, 2));
        } else {
            const error = await analysisResponse.text();
            console.log('❌ Analysis failed:', error);
        }
        
        // Clean up test file
        fs.unlinkSync(testImagePath);
        
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
        // Try to import the Gemini service
        const geminiPath = path.join(__dirname, 'server', 'services', 'gemini.ts');
        console.log('Gemini service path:', geminiPath);
        console.log('File exists:', fs.existsSync(geminiPath));
        
        // Check if API key is available
        const hasKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0;
        console.log('🔑 Gemini API Key available:', hasKey);
        
        if (!hasKey) {
            console.log('⚠️  No Gemini API key found. Service will use fallback responses.');
        }
        
    } catch (error) {
        console.log('❌ GeminiService error:', error.message);
    }
}

// Test without authentication
async function testWithoutAuth() {
    console.log('🔓 Testing without authentication...');
    
    try {
        const response = await fetch('http://localhost:5000/api/gemini/analyze-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: 'data'
            })
        });
        
        console.log('Response status:', response.status);
        const result = await response.text();
        console.log('Response:', result);
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

// Test with curl-like request
async function testWithCurl() {
    console.log('🔄 Testing with curl-like request...');
    
    try {
        const response = await fetch('http://localhost:5000/api/gemini/analyze-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
            },
            body: '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\ntest content\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--'
        });
        
        console.log('Response status:', response.status);
        const result = await response.text();
        console.log('Response:', result);
        
    } catch (error) {
        console.log('Error:', error.message);
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
    
    await testWithoutAuth();
    console.log('');
    
    await testWithCurl();
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