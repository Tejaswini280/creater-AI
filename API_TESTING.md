# API Testing Guide

## Issues Fixed

The following issues have been resolved:

1. **AI Token Expiration Error**: Fixed authentication in CreateProjectForm to use cookies instead of localStorage tokens
2. **401 Unauthorized Error**: Fixed project creation to use proper authentication with cookies
3. **400 Bad Request Error**: Fixed project data structure to match validation schema

## Testing the Fixes

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Test API Endpoints
```bash
node test-api.js
```

### 3. Test Authentication

#### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Test Authenticated Endpoint
```bash
curl -X GET http://localhost:5000/api/auth/test \
  -b cookies.txt
```

### 4. Test Project Creation

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Project",
    "description": "Test Description",
    "type": "social-media",
    "platform": "instagram",
    "targetAudience": "test audience",
    "estimatedDuration": "1week",
    "tags": ["test"],
    "isPublic": false,
    "status": "active",
    "metadata": {}
  }'
```

### 5. Test AI Content Generation

```bash
curl -X POST http://localhost:5000/api/social-ai/generate-project-content \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "projectName": "Test Project",
    "contentName": "Test Content",
    "contentDescription": "Test Description",
    "contentType": "post",
    "channelType": "instagram",
    "targetAudience": "test audience",
    "startDate": "2024-01-01",
    "endDate": "2024-01-07",
    "totalDays": 7
  }'
```

## Environment Variables

For AI features to work, set the following environment variable:

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

If the API key is not set, the system will use fallback content generation.

## Frontend Testing

1. Open the frontend application
2. Navigate to the project creation form
3. Fill out the form with test data
4. Submit the form - it should now work without the previous errors

## Expected Behavior

- ✅ No more "Invalid or expired token" errors
- ✅ No more 401 Unauthorized errors
- ✅ No more 400 Bad Request validation errors
- ✅ AI content generation works (with fallback if no API key)
- ✅ Project creation works with proper authentication
