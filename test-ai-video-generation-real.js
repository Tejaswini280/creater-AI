const fs = require('fs');
const path = require('path');

// Test the AI video generation service
async function testAIVideoGeneration() {
  console.log('🎬 Testing Real AI Video Generation...\n');
  
  try {
    // Test the video generation endpoint
    const response = await fetch('http://localhost:3000/api/ai/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over the ocean with waves crashing on the shore',
        duration: 15,
        style: 'modern',
        music: 'upbeat'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Video Generation Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.result) {
      console.log('\n🎬 Generated Video Details:');
      console.log(`- Title: ${data.result.title}`);
      console.log(`- Duration: ${data.result.duration}s`);
      console.log(`- Style: ${data.result.metadata.style}`);
      console.log(`- Music: ${data.result.metadata.music}`);
      console.log(`- Model: ${data.result.metadata.model}`);
      console.log(`- Video URL: ${data.result.videoUrl}`);
      console.log(`- Thumbnail URL: ${data.result.thumbnailUrl}`);
      
      // Check if video file exists
      const videoPath = path.join(process.cwd(), 'uploads', 'ai-videos', path.basename(data.result.videoUrl));
      if (fs.existsSync(videoPath)) {
        const stats = fs.statSync(videoPath);
        console.log(`\n✅ Video file created successfully!`);
        console.log(`- File path: ${videoPath}`);
        console.log(`- File size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`- Created: ${stats.birthtime}`);
      } else {
        console.log(`\n❌ Video file not found at: ${videoPath}`);
      }
      
      // Check if thumbnail file exists
      const thumbnailPath = path.join(process.cwd(), 'uploads', 'ai-videos', path.basename(data.result.thumbnailUrl));
      if (fs.existsSync(thumbnailPath)) {
        const stats = fs.statSync(thumbnailPath);
        console.log(`\n✅ Thumbnail file created successfully!`);
        console.log(`- File path: ${thumbnailPath}`);
        console.log(`- File size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`- Created: ${stats.birthtime}`);
      } else {
        console.log(`\n❌ Thumbnail file not found at: ${thumbnailPath}`);
      }
      
      // Test video file serving
      console.log('\n🎬 Testing video file serving...');
      try {
        const videoResponse = await fetch(`http://localhost:3000${data.result.videoUrl}`);
        if (videoResponse.ok) {
          console.log('✅ Video file served successfully');
          console.log(`- Content-Type: ${videoResponse.headers.get('content-type')}`);
          console.log(`- Content-Length: ${videoResponse.headers.get('content-length')}`);
        } else {
          console.log(`❌ Failed to serve video file: ${videoResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Error serving video file: ${error.message}`);
      }
      
      // Test thumbnail file serving
      console.log('\n🖼️ Testing thumbnail file serving...');
      try {
        const thumbnailResponse = await fetch(`http://localhost:3000${data.result.thumbnailUrl}`);
        if (thumbnailResponse.ok) {
          console.log('✅ Thumbnail file served successfully');
          console.log(`- Content-Type: ${thumbnailResponse.headers.get('content-type')}`);
          console.log(`- Content-Length: ${thumbnailResponse.headers.get('content-length')}`);
        } else {
          console.log(`❌ Failed to serve thumbnail file: ${thumbnailResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Error serving thumbnail file: ${error.message}`);
      }
      
    } else {
      console.log('❌ Video generation failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure the server is running on http://localhost:3000');
      console.log('💡 Run: npm run dev or npm start');
    }
  }
}

// Run the test
testAIVideoGeneration();
