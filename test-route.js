const http = require('http');

console.log('Testing new-project-enhanced route...\n');

// Test the main route
const req1 = http.get('http://localhost:5000/new-project-enhanced', (res) => {
  console.log('Route test:');
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Response length: ${data.length} characters`);
    console.log(`Contains React app: ${data.includes('<div id="root">')}`);
    console.log(`Contains error message: ${data.includes('Error loading')}`);
    console.log('\nFirst 500 characters of response:');
    console.log(data.substring(0, 500) + '...\n');
  });
});

req1.on('error', (err) => {
  console.error('Route test failed:', err.message);
});

// Test the API endpoint
setTimeout(() => {
  console.log('Testing API endpoint...\n');

  const postData = JSON.stringify({
    text: 'Test content',
    field: 'title',
    context: { contentType: 'post' }
  });

  const req2 = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/enhance-content',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    console.log('API test:');
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('API Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Raw API Response:', data);
      }
      process.exit(0);
    });
  });

  req2.on('error', (err) => {
    console.error('API test failed:', err.message);
    process.exit(1);
  });

  req2.write(postData);
  req2.end();
}, 1000);
