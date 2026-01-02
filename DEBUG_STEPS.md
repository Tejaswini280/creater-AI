# Debug Steps for Media Analysis Error

## Current Issue
You're getting "Failed to analyze file" error (500 Internal Server Error) when clicking "Analyze Media" in Creator Studio.

## Step-by-Step Debugging

### Step 1: Check Server Status
1. **Open**: `http://localhost:5000/test-server-status.html`
2. **Click**: "Test Server Health"
3. **Expected**: ✅ "Server is running!"

### Step 2: Check Gemini Endpoints
1. **In the same page**, click "Test Gemini Health"
2. **Expected**: ✅ "Gemini endpoints are working!"

### Step 3: Check Upload Directory
1. **Click**: "Test Upload Directory"
2. **Expected**: ✅ "Uploads directory exists!"

### Step 4: Test Simple Endpoint
1. **Click**: "Test Simple Endpoint"
2. **Expected**: ✅ "Simple endpoint working!"

### Step 5: Test File Upload (Simple)
1. **Open**: `http://localhost:5000/test-media-analysis-simple.html`
2. **Select an image file**
3. **Click**: "Test Simple Upload"
4. **Expected**: ✅ "Simple upload successful!"

### Step 6: Test Analysis (No Auth)
1. **In the same page**, select an image file
2. **Click**: "Test Media Analysis"
3. **Expected**: ✅ "Analysis successful!" (with fallback results)

## What Each Test Tells Us

- **Server Health**: Is the server running?
- **Gemini Health**: Are the endpoints accessible?
- **Upload Directory**: Does the uploads folder exist?
- **Simple Endpoint**: Is basic POST functionality working?
- **Simple Upload**: Is file upload working?
- **Analysis**: Is the analysis logic working?

## Expected Results

If all tests pass, the issue might be:
1. **Authentication**: User not logged in properly
2. **Frontend**: Issue with how the frontend sends the request
3. **Specific file**: Issue with the particular file being uploaded

## If Tests Fail

- **Server not running**: Start with `npm run dev`
- **Upload directory missing**: Server will create it automatically
- **Analysis fails**: Check server console for specific errors

## Next Steps

1. **Run all tests** in order
2. **Report results** for each test
3. **Check server console** for any error messages
4. **If all tests pass**, try the authenticated version in Creator Studio

## Server Console Logs

Watch the server console for these messages:
- "=== Analyze file endpoint called ==="
- "Request method: POST"
- "Content-Type: multipart/form-data"
- "Setting up multer upload..."
- "Multer callback executed"
- "File object: exists"
- "Analyzing file: [filename]"
- "Image analysis completed successfully"

## Files Created for Testing

- `test-server-status.html` - Server health and endpoint tests
- `test-media-analysis-simple.html` - File upload and analysis tests
- Added debugging logs to `server/routes.ts`
- Added test endpoints for isolation

Run these tests and let me know the results! 