// Simple test script to check server status
const http = require('http');

console.log('Testing server connection...');

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
}, (res) => {
    console.log(`Server responded with status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('Server response:', jsonData);
        } catch (e) {
            console.log('Server response (not JSON):', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
