const fetch = require('node-fetch');

async function testProjectCreationFlow() {
  const BASE_URL = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing complete project creation flow...');
    
    // Step 1: Create a project
    console.log('\n📝 Step 1: Creating project...');
    const projectResponse = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        name: 'Test Project - Complete Flow',
        description: 'This is a test project for the complete creation flow',
        type: 'video',
        platform: 'youtube',
        targetAudience: 'General audience',
        estimatedDuration: '5-10 minutes',
        tags: ['test', 'flow', 'video'],
        isPublic: false
      })
    });
    
    console.log('📡 Project creation response status:', projectResponse.status);
    
    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      console.log('✅ Project created successfully:', projectData);
      
      const projectId = projectData.project.id;
      
      // Step 2: Create content for the project
      console.log('\n📝 Step 2: Creating content for the project...');
      const contentResponse = await fetch(`${BASE_URL}/api/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: 'Test Content for Project',
          description: 'This content belongs to the test project',
          platform: 'youtube',
          contentType: 'video',
          tags: 'test,project,content',
          status: 'draft',
          projectId: projectId
        })
      });
      
      console.log('📡 Content creation response status:', contentResponse.status);
      
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        console.log('✅ Content created successfully:', contentData);
        
        // Step 3: Verify project appears in projects list
        console.log('\n📝 Step 3: Verifying project appears in projects list...');
        const projectsResponse = await fetch(`${BASE_URL}/api/projects`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const projectExists = projectsData.projects.some(p => p.id === projectId);
          console.log('✅ Project found in projects list:', projectExists);
          console.log('📊 Total projects:', projectsData.projects.length);
        }
        
        // Step 4: Verify content appears in project content
        console.log('\n📝 Step 4: Verifying content appears in project content...');
        const projectContentResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/content`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        if (projectContentResponse.ok) {
          const projectContentData = await projectContentResponse.json();
          console.log('✅ Project content retrieved:', projectContentData);
          console.log('📊 Content count for project:', projectContentData.content?.length || 0);
        }
        
      } else {
        const errorText = await contentResponse.text();
        console.error('❌ Content creation failed:', errorText);
      }
      
    } else {
      const errorText = await projectResponse.text();
      console.error('❌ Project creation failed:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Error testing project creation flow:', error.message);
  }
}

testProjectCreationFlow();
