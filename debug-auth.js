// Debug script to test authentication
console.log('🔍 Starting authentication debug...');

// Check localStorage
console.log('🔍 localStorage contents:');
console.log('token:', !!localStorage.getItem('token'));
console.log('user:', !!localStorage.getItem('user'));
console.log('refreshToken:', !!localStorage.getItem('refreshToken'));

// Test API endpoint
fetch('/api/health')
  .then(response => {
    console.log('🔍 Health check response:', response.status);
    return response.text();
  })
  .then(data => {
    console.log('🔍 Health check data:', data);
  })
  .catch(error => {
    console.error('🔍 Health check error:', error);
  });

// Test auth endpoint
fetch('/api/auth/user', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(response => {
    console.log('🔍 Auth check response:', response.status);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(data => {
    console.log('🔍 Auth check success:', data);
  })
  .catch(error => {
    console.error('🔍 Auth check error:', error.message);
  });

console.log('🔍 Debug script completed');
