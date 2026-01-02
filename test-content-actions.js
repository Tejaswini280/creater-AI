import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test configuration with authentication
const testConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // Mock token for testing
  }
};

async function testContentActions() {
  console.log('🔧 Testing Content Actions (Delete & Duplicate)...\n');

  // Test 1: Create a test content first
  console.log('1. Creating test content...');
  let testContentId;
  try {
    const createResponse = await axios.post(`${BASE_URL}/api/content`, {
      title: 'Test Content for Actions',
      description: 'This is test content for delete and duplicate testing',
      platform: 'youtube',
      contentType: 'video',
      status: 'draft'
    }, testConfig);
    
    if (createResponse.status === 201) {
      testContentId = createResponse.data.content.id;
      console.log('✅ Test content created successfully');
      console.log('   Content ID:', testContentId);
    } else {
      console.log('❌ Failed to create test content:', createResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Error creating test content:', error.response?.status, error.response?.data?.message || error.message);
    return;
  }

  // Test 2: Duplicate the content
  console.log('\n2. Testing Duplicate Content...');
  try {
    const duplicateResponse = await axios.post(`${BASE_URL}/api/content/${testContentId}/duplicate`, {}, testConfig);
    
    if (duplicateResponse.status === 201) {
      console.log('✅ Content duplicated successfully');
      console.log('   Response:', duplicateResponse.data);
    } else {
      console.log('❌ Failed to duplicate content:', duplicateResponse.status, duplicateResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Error duplicating content:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 3: Delete the original content
  console.log('\n3. Testing Delete Content...');
  try {
    const deleteResponse = await axios.delete(`${BASE_URL}/api/content/${testContentId}`, testConfig);
    
    if (deleteResponse.status === 200) {
      console.log('✅ Content deleted successfully');
      console.log('   Response:', deleteResponse.data);
    } else {
      console.log('❌ Failed to delete content:', deleteResponse.status, deleteResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Error deleting content:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 4: Verify content was deleted (should return 404)
  console.log('\n4. Verifying content deletion...');
  try {
    const getResponse = await axios.get(`${BASE_URL}/api/content/${testContentId}`, testConfig);
    console.log('❌ Content still exists (should be deleted):', getResponse.status);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Content successfully deleted (404 as expected)');
    } else {
      console.log('❌ Unexpected error verifying deletion:', error.response?.status, error.response?.data?.message || error.message);
    }
  }

  console.log('\n🔍 Content Actions Test Complete');
}

// Run the tests
testContentActions().catch(console.error); 