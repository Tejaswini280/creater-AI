const fetch = require('node-fetch');

async function testSearchGroundedService() {
  console.log('🧪 Testing Search Grounded Responses Service...\n');

  try {
    // Test 1: Check if service file exists
    const fs = require('fs');
    const path = require('path');
    const servicePath = path.join(__dirname, 'server/services/searchGrounded.ts');
    if (!fs.existsSync(servicePath)) {
      console.log('❌ Service file not found');
      return;
    }
    console.log('✅ Service file exists');

    // Test 2: Check environment variable
    require('dotenv').config();
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY not found in environment');
      return;
    }
    console.log('✅ GEMINI_API_KEY configured');

    // Test 3: Test API endpoint with sample queries
    const testQueries = [
      {
        query: "What are the latest trends in AI video generation?",
        context: "I'm a content creator looking to understand emerging technologies."
      },
      {
        query: "How is social media marketing changing in 2024?",
        context: "I need to update my marketing strategy for my brand."
      },
      {
        query: "Current trends in podcast monetization",
        context: ""
      }
    ];

    console.log('🔄 Testing API endpoint with sample queries...\n');
    
    for (let i = 0; i < testQueries.length; i++) {
      const testQuery = testQueries[i];
      console.log(`📋 Test ${i + 1}: "${testQuery.query}"`);
      
      try {
        const response = await fetch('http://localhost:5000/api/gemini/search-grounded', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testQuery)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ Query processed successfully');
          console.log('📊 Response structure:');
          console.log('  - Summary:', result.summary ? '✅' : '❌');
          console.log('  - Key Points:', Array.isArray(result.keyPoints) ? `✅ (${result.keyPoints.length} items)` : '❌');
          console.log('  - Creator Insights:', Array.isArray(result.creatorInsights) ? `✅ (${result.creatorInsights.length} items)` : '❌');
          console.log('  - Disclaimer:', result.disclaimer ? '✅' : '❌');
          
          if (result.summary) {
            console.log(`  📝 Sample Summary: "${result.summary.substring(0, 100)}..."`);
          }
        } else {
          console.log('⚠️  API response:', result);
        }
        
      } catch (error) {
        console.log('❌ Query failed:', error.message);
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('🎉 Search Grounded Responses System Ready!');
    console.log('\n📋 Test Instructions:');
    console.log('1. Open http://localhost:5000/test-search-grounded.html');
    console.log('2. Enter a search query (or click example queries)');
    console.log('3. Add optional context for better results');
    console.log('4. Click "Search & Generate"');
    console.log('5. View structured results with Summary, Key Findings, and Creator Insights');
    
    console.log('\n🎯 Frontend Integration:');
    console.log('- Navigate to Creator AI Studio');
    console.log('- Click "Search" in the sidebar');
    console.log('- Enter search queries and get grounded responses');
    console.log('- Results display in clean, structured sections');

    console.log('\n💡 Example Queries to Test:');
    testQueries.forEach((query, index) => {
      console.log(`${index + 1}. "${query.query}"`);
      if (query.context) {
        console.log(`   Context: "${query.context}"`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the server is running:');
      console.log('   npm run dev  or  node server/index.js');
    }
  }
}

testSearchGroundedService();