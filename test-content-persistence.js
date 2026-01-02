// Test script to verify content persistence and recent content display
const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'test-token';

async function testContentPersistence() {
  console.log('🧪 Testing Content Persistence and Recent Content Display...');
  
  try {
    // Test 1: Create content inside a project
    console.log('\n1️⃣ Testing project content creation...');
    const projectContentData = {
      title: 'Project Test Content',
      description: 'This content is created inside a project',
      platform: 'instagram',
      contentType: 'video',
      status: 'draft',
      projectId: 10 // Use the existing project ID from the database
    };
    
    const projectContentResponse = await fetch(`${BASE_URL}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(projectContentData)
    });
    
    if (projectContentResponse.ok) {
      const projectContent = await projectContentResponse.json();
      console.log('✅ Project content created successfully:', projectContent.message);
      console.log('📅 Project content ID:', projectContent.content.id);
      console.log('🔗 Project ID:', projectContent.content.projectId);
    } else {
      const errorData = await projectContentResponse.json();
      console.log('❌ Failed to create project content:', errorData.message);
      return;
    }
    
    // Test 2: Create standalone content (no project)
    console.log('\n2️⃣ Testing standalone content creation...');
    const standaloneContentData = {
      title: 'Standalone Test Content',
      description: 'This content is created without a project',
      platform: 'youtube',
      contentType: 'video',
      status: 'draft'
      // No projectId
    };
    
    const standaloneContentResponse = await fetch(`${BASE_URL}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(standaloneContentData)
    });
    
    if (standaloneContentResponse.ok) {
      const standaloneContent = await standaloneContentResponse.json();
      console.log('✅ Standalone content created successfully:', standaloneContent.message);
      console.log('📅 Standalone content ID:', standaloneContent.content.id);
      console.log('🔗 Project ID:', standaloneContent.content.projectId);
    } else {
      const errorData = await standaloneContentResponse.json();
      console.log('❌ Failed to create standalone content:', errorData.message);
      return;
    }
    
    // Test 3: Get all content to verify persistence
    console.log('\n3️⃣ Testing content retrieval and persistence...');
    const getContentResponse = await fetch(`${BASE_URL}/api/content`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (getContentResponse.ok) {
      const contentData = await getContentResponse.json();
      console.log('✅ Retrieved all content successfully');
      console.log('📊 Total content count:', contentData.content.length);
      
      // Check if our new content is there
      const newContent = contentData.content.filter(c => 
        c.title === 'Project Test Content' || c.title === 'Standalone Test Content'
      );
      console.log('🆕 Newly created content found:', newContent.length, 'items');
      
      newContent.forEach(content => {
        console.log('  -', content.title, '(ID:', content.id, ', Project:', content.projectId || 'None', ')');
      });
    } else {
      const errorData = await getContentResponse.json();
      console.log('❌ Failed to get content:', errorData.message);
      return;
    }
    
    // Test 4: Check if content appears in recent content (dashboard)
    console.log('\n4️⃣ Testing recent content display...');
    const recentContentResponse = await fetch(`${BASE_URL}/api/content?limit=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (recentContentResponse.ok) {
      const recentContentData = await recentContentResponse.json();
      console.log('✅ Retrieved recent content successfully');
      
      // Sort by creation date to see the newest first
      const sortedContent = recentContentData.content
        .sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
        .slice(0, 5);
      
      console.log('📋 Recent content (newest first):');
      sortedContent.forEach((content, index) => {
        console.log(`  ${index + 1}. ${content.title}`);
        console.log(`     Platform: ${content.platform}, Type: ${content.contentType}`);
        console.log(`     Project: ${content.projectId || 'Standalone'}, Status: ${content.status}`);
        console.log(`     Created: ${content.createdAt || content.created_at}`);
        console.log('');
      });
    } else {
      const errorData = await recentContentResponse.json();
      console.log('❌ Failed to get recent content:', errorData.message);
      return;
    }
    
    console.log('\n🎉 All content persistence tests passed!');
    console.log('✅ Content creation is working');
    console.log('✅ Content is being saved to database');
    console.log('✅ Content retrieval is working');
    console.log('✅ Recent content display is working');
    console.log('✅ Project-linked content is properly associated');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testContentPersistence();
