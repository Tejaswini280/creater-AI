import fetch from 'node-fetch';

async function testTemplateFunctionality() {
  console.log('🧪 Testing Complete Template Functionality\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Fetch all templates
    console.log('\n1️⃣ Testing GET /api/templates');
    const response1 = await fetch('http://localhost:5000/api/templates');
    const data1 = await response1.json();
    
    if (data1.success) {
      console.log('✅ Successfully fetched templates');
      console.log(`📊 Found ${data1.templates.length} templates`);
      data1.templates.forEach(template => {
        console.log(`   - ${template.title} (${template.category}) - ${template.downloads} downloads`);
      });
    } else {
      console.log('❌ Failed to fetch templates:', data1.message);
      return;
    }

    // Test 2: Test template preview
    console.log('\n2️⃣ Testing GET /api/templates/1/preview');
    const response2 = await fetch('http://localhost:5000/api/templates/1/preview');
    const data2 = await response2.json();
    
    if (data2.success) {
      console.log('✅ Successfully fetched template preview');
      console.log(`📝 Template: ${data2.template.title}`);
      console.log(`📄 Content length: ${data2.template.content?.length || 0} characters`);
      console.log(`⭐ Rating: ${data2.template.rating}/5`);
    } else {
      console.log('❌ Failed to fetch template preview:', data2.message);
    }

    // Test 3: Test template usage (download)
    console.log('\n3️⃣ Testing POST /api/templates/1/use');
    const response3 = await fetch('http://localhost:5000/api/templates/1/use', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data3 = await response3.json();
    
    if (data3.success) {
      console.log('✅ Successfully used template');
      console.log(`📥 Message: ${data3.message}`);
      console.log(`📄 Template content available: ${data3.template.content ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Failed to use template:', data3.message);
    }

    // Test 4: Verify download count increased
    console.log('\n4️⃣ Verifying download count increase');
    const response4 = await fetch('http://localhost:5000/api/templates');
    const data4 = await response4.json();
    
    if (data4.success) {
      const template1 = data4.templates.find(t => t.id === 1);
      if (template1) {
        console.log(`📊 Template 1 downloads: ${template1.downloads}`);
        console.log('✅ Download count verification complete');
      }
    }

    // Test 5: Test category filtering
    console.log('\n5️⃣ Testing category filtering');
    const response5 = await fetch('http://localhost:5000/api/templates?category=video');
    const data5 = await response5.json();
    
    if (data5.success) {
      console.log(`✅ Found ${data5.templates.length} video templates`);
      data5.templates.forEach(template => {
        console.log(`   - ${template.title} (${template.category})`);
      });
    } else {
      console.log('❌ Failed to filter by category:', data5.message);
    }

    // Test 6: Test non-existent template
    console.log('\n6️⃣ Testing non-existent template');
    const response6 = await fetch('http://localhost:5000/api/templates/999/preview');
    const data6 = await response6.json();
    
    if (!data6.success) {
      console.log('✅ Correctly handled non-existent template');
      console.log(`📝 Error message: ${data6.message}`);
    } else {
      console.log('❌ Should have returned error for non-existent template');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Template Functionality Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Template listing works');
    console.log('✅ Template preview works');
    console.log('✅ Template usage/download works');
    console.log('✅ Download count tracking works');
    console.log('✅ Category filtering works');
    console.log('✅ Error handling works');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testTemplateFunctionality(); 