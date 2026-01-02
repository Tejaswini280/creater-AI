# Recorder Page API Integration Map

## Overview
The recorder page has limited direct API integration but relies heavily on browser APIs for media operations. This document maps all API calls, endpoints, and integration points.

## Browser API Integrations

### 1. MediaDevices API
**Purpose**: Access camera, microphone, and screen capture
**Methods Used**:
```javascript
// Camera/Microphone Access
navigator.mediaDevices.getUserMedia({
  video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  }
})

// Screen Capture
navigator.mediaDevices.getDisplayMedia({
  video: {
    displaySurface: 'monitor', // or 'window'
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  },
  audio: true
})
```
**Permissions Required**:
- `camera`: For camera recording
- `microphone`: For audio recording
- `screen`: For screen capture
- `display-capture`: For screen recording

**Error Handling**: Permission denied, device not found, device busy

### 2. MediaRecorder API
**Purpose**: Record media streams to file
**Implementation**:
```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 8000000 // 8Mbps for high quality
});

mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    chunksRef.current.push(event.data);
  }
};

mediaRecorder.onstop = () => {
  const blob = new Blob(chunksRef.current, { type: mimeType });
  const mediaUrl = URL.createObjectURL(blob);
  // Process recorded media
};
```
**Supported Formats**:
- `video/webm;codecs=vp9,opus` (preferred)
- `video/webm;codecs=vp8,opus` (fallback)
- `video/webm` (basic fallback)

### 3. Canvas API
**Purpose**: Composite video streams (screen + camera overlay)
**Implementation**:
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = screenStream.width;
canvas.height = screenStream.height;

// Composite rendering function
const compositeFrame = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw screen content
  ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

  // Draw camera overlay
  ctx.drawImage(cameraVideo, cameraX, cameraY, cameraWidth, cameraHeight);

  requestAnimationFrame(compositeFrame);
};
```
**Performance Considerations**: 30 FPS capture stream, efficient rendering loop

### 4. File API
**Purpose**: Handle file downloads and blob operations
**Methods Used**:
```javascript
// Create download URL
const mediaUrl = URL.createObjectURL(mediaBlob);

// Create download link
const a = document.createElement('a');
a.href = mediaUrl;
a.download = `${recordingName}.webm`;
a.click();

// Cleanup
URL.revokeObjectURL(mediaUrl);
```

## Backend API Endpoints (Current Usage)

### Authentication Endpoints
**Status**: Used via `useAuth` hook

#### POST /api/auth/refresh
```typescript
// Token refresh endpoint
{
  "refreshToken": "string"
}

// Response
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### POST /api/logout
```typescript
// Logout endpoint (called by useAuth)
// No request body required
// Clears server-side session
```

### Health Check Endpoint
**Status**: Not used in recorder component

#### GET /api/health
```typescript
// Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## Planned/Missing API Integrations

### Media Upload API
**Status**: Configured but not implemented
**Purpose**: Upload recordings to cloud storage

```typescript
// Planned endpoint
POST /api/upload/media
Content-Type: multipart/form-data

// Request body
{
  file: File, // Media blob
  metadata: {
    type: 'recording',
    duration: number,
    quality: 'high' | 'medium' | 'low',
    format: 'webm'
  }
}

// Response
{
  "id": "string",
  "url": "string",
  "thumbnailUrl": "string"
}
```

### Content Creation API
**Status**: Available but not used in recorder
**Purpose**: Save recordings as content items

```typescript
// Planned endpoint
POST /api/content
{
  "title": "string",
  "description": "string",
  "contentType": "video",
  "platform": "youtube",
  "videoUrl": "string",
  "metadata": {
    "recordingType": "camera",
    "duration": 120,
    "quality": "high"
  }
}
```

### AI Processing APIs
**Status**: Services available but not integrated

#### POST /api/ai/analyze-media
```typescript
{
  "mediaUrl": "string",
  "analysisType": "transcription" | "thumbnail" | "description"
}
```

#### POST /api/ai/generate-thumbnails
```typescript
{
  "videoUrl": "string",
  "count": 3,
  "timestamps": [30, 60, 90]
}
```

## WebSocket Integration

### Current Status
**Status**: WebSocket server configured but not used in recorder

### Potential Usage
```typescript
// Live streaming integration
const ws = new WebSocket('/ws/live-stream');

// Send live frames
ws.send(frameData);

// Receive processing results
ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  // Handle AI processing results
};
```

## Third-party API Integrations

### Google AI (Gemini)
**Status**: Service configured but not used
**Purpose**: AI-powered video analysis and enhancement

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

// Potential usage: Video content analysis
const result = await model.generateContent([
  'Analyze this video content for engagement potential',
  videoFrame
]);
```

### OpenAI Integration
**Status**: Service configured but not used
**Purpose**: Content generation and analysis

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Potential usage: Video transcription
const transcription = await openai.audio.transcriptions.create({
  file: audioBlob,
  model: 'whisper-1'
});
```

### YouTube API
**Status**: Service configured but not used
**Purpose**: Direct video upload to YouTube

```typescript
// Potential integration for direct YouTube upload
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

await youtube.videos.insert({
  part: 'snippet,status',
  requestBody: {
    snippet: {
      title: recordingName,
      description: 'Recorded with Creator Nexus'
    },
    status: {
      privacyStatus: 'private'
    }
  },
  media: {
    body: mediaBlob
  }
});
```

## API Error Handling

### Current Error Handling
```typescript
// Browser API errors
try {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
} catch (error) {
  if (error.name === 'NotAllowedError') {
    toast({ title: 'Permission Denied', description: 'Camera/microphone access required' });
  } else if (error.name === 'NotFoundError') {
    toast({ title: 'Device Not Found', description: 'No camera/microphone detected' });
  }
}

// Network errors (via apiRequest)
try {
  const response = await apiRequest('POST', '/api/upload', formData);
} catch (error) {
  if (error.status === 401) {
    // Token refresh logic
  } else if (error.status === 413) {
    toast({ title: 'File Too Large', description: 'Maximum file size is 100MB' });
  }
}
```

### Missing Error Scenarios
1. **Network Connectivity**: No offline handling
2. **Rate Limiting**: No retry logic for 429 responses
3. **Server Errors**: Generic error handling for 5xx responses
4. **Partial Uploads**: No resume functionality
5. **Concurrent Sessions**: No handling for multiple recording sessions

## API Security Considerations

### Current Security
- **Authentication**: JWT tokens with refresh mechanism
- **HTTPS**: Required for media access
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Server-side rate limiting implemented

### Security Gaps
1. **File Validation**: No client-side file type validation
2. **Content Scanning**: No virus/malware scanning
3. **Size Limits**: 100MB limit but no chunked upload
4. **Session Management**: No session timeout handling
5. **Audit Logging**: No API call auditing

## Performance Optimization

### Current Optimizations
- **Connection Pooling**: Database connection pooling
- **Compression**: Response compression enabled
- **Caching**: Browser cache for static assets

### Performance Gaps
1. **Large File Uploads**: No chunked upload support
2. **Concurrent Recordings**: No queue management
3. **Memory Management**: Canvas operations not optimized
4. **Network Efficiency**: No request deduplication

## API Testing Coverage

### Unit Tests
- ✅ Browser API mocks
- ❌ Network request mocking
- ❌ Error scenario testing

### Integration Tests
- ❌ API endpoint testing
- ❌ Authentication flow testing
- ❌ File upload testing

### E2E Tests
- ❌ Complete recording workflow
- ❌ Cross-browser compatibility
- ❌ Network condition testing

## API Contract Documentation

### Request/Response Schemas
**Status**: Partially documented in code comments
**Recommendation**: Use OpenAPI/Swagger for API documentation

### Versioning Strategy
**Status**: No versioning implemented
**Recommendation**: URL-based versioning (`/api/v1/`)

## Future API Enhancements

### 1. Real-time Collaboration
```typescript
// WebRTC for collaborative recording
const peerConnection = new RTCPeerConnection();
peerConnection.addTrack(track, stream);
```

### 2. Cloud Storage Integration
```typescript
// Direct upload to cloud storage
const uploadUrl = await getSignedUrl();
await fetch(uploadUrl, { method: 'PUT', body: mediaBlob });
```

### 3. AI-Powered Features
```typescript
// Real-time AI analysis during recording
const analysis = await analyzeStream(stream);
```

### 4. Advanced Export Options
```typescript
// Multiple format export
const exportOptions = {
  format: 'mp4',
  quality: '4k',
  compression: 'h264'
};
```

This API map provides a comprehensive view of current and planned integrations for the recorder component.
