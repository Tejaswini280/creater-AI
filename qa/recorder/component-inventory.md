# Recorder Page Component Inventory

## Overview
The recorder page (`client/src/pages/recorder.tsx`) is a comprehensive video/audio recording and editing application built with React, TypeScript, and modern web APIs.

## Architecture Summary
- **Framework**: React 18 with TypeScript
- **State Management**: React useState/useRef hooks
- **UI Library**: Radix UI components with Tailwind CSS
- **Backend**: Node.js with Express, PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with refresh token flow
- **Real-time**: WebSocket support for live features
- **File Storage**: Local storage with future cloud integration

## Component Hierarchy & Import Graph

### Main Component: Recorder (`client/src/pages/recorder.tsx`)
**File Size**: 2,350 lines
**Complexity**: High (multiple feature sets)
**Dependencies**:
- React hooks: `useState`, `useRef`, `useEffect`, `useCallback`
- UI components: `Card`, `Button`, `Input`, `Label`, `Badge`, `Tabs`, `Slider`
- Icons: Lucide React (51 icons imported)
- Routing: `useLocation` from wouter
- Authentication: `useAuth` hook
- Notifications: `useToast` hook

### Key State Objects
1. **RecordingState** - Manages recording lifecycle, media data, playback
2. **VideoFilters** - Brightness, contrast, saturation, blur, sepia controls
3. **TextOverlay** - Text positioning, styling, timing for video overlays
4. **CropSettings** - Video cropping parameters
5. **SavedRecordings** - Library of completed recordings

### Sub-components (Inline/Embedded)
1. **Recording Options Grid** - Camera, Audio, Screen, Screen+Camera, Slides+Camera, Slides
2. **Recording Window Overlay** - Live preview and recording controls
3. **Video Preview** - Playback with timeline and controls
4. **Editing Tools Panel** - Trim, crop, filters, text, audio controls
5. **Export Settings** - Format, quality, settings configuration
6. **Library Grid** - Saved recordings display with actions

## API Integration Points

### Authentication
- **Hook**: `useAuth()` from `@/hooks/useAuth`
- **Endpoints**: `/api/auth/refresh` (token refresh)
- **Storage**: LocalStorage for tokens and user data
- **Features**: Auto token refresh, logout handling, auth state persistence

### Media Operations
- **WebRTC**: `navigator.mediaDevices.getUserMedia()` for camera/audio
- **Screen Capture**: `navigator.mediaDevices.getDisplayMedia()` for screen recording
- **MediaRecorder**: Browser-native recording with WebM format
- **Canvas API**: Composite streams for screen+camera overlays

### File Operations
- **Blob Handling**: `URL.createObjectURL()` for media preview
- **Download**: Browser download API for export
- **Local Storage**: Client-side persistence for recordings

## Database Schema Integration

### Relevant Tables (from `@shared/schema.ts`)
1. **users** - User authentication and profile data
2. **content** - Content metadata storage
3. **content_metrics** - Performance analytics
4. **ai_generation_tasks** - AI processing jobs
5. **social_posts** - Social media content planning
6. **projects** - Project organization

### Current Limitations
- No direct database persistence for recordings (client-side only)
- No cloud storage integration
- Missing media metadata storage
- No recording session tracking

## Feature Flags & Configuration

### Quality Settings
- **High**: 1920x1080 (8Mbps video bitrate)
- **Medium**: 1280x720 (4Mbps video bitrate)
- **Low**: 854x480 (2Mbps video bitrate)

### Recording Types
1. **Camera**: `video: {width: ideal, height: ideal}, audio: true`
2. **Audio**: `audio: {echoCancellation: true, noiseSuppression: true, sampleRate: 44100}`
3. **Screen**: `video: {displaySurface: 'monitor'}, audio: true`
4. **Screen+Camera**: Composite stream with camera overlay
5. **Slides+Camera**: Window capture with camera overlay
6. **Slides**: Window capture only

## WebSocket Integration
- **File**: `client/src/hooks/useWebSocket.ts`
- **Purpose**: Real-time communication (not currently used in recorder)
- **Potential**: Live streaming, collaborative editing

## Third-party Services
- **Google AI**: For potential AI-powered features
- **OpenAI**: For content generation and analysis
- **Cloudinary**: For media storage (configured but not used)

## Performance Considerations
- **Memory Management**: Proper cleanup of MediaStream tracks
- **Canvas Optimization**: Efficient compositing for screen+camera
- **Event Handling**: Debounced controls and optimized re-renders
- **File Size**: 100MB upload limit configured

## Security Considerations
- **Media Access**: User permission prompts for camera/screen
- **Data Storage**: Client-side only (no server persistence)
- **Input Validation**: Basic filename validation
- **CORS**: Configured for cross-origin requests

## Accessibility Features
- **Keyboard Navigation**: Tab order and keyboard activation
- **Screen Reader**: ARIA labels and announcements
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: WCAG compliant color schemes

## Testing Coverage Gaps
- **Unit Tests**: Missing for most utility functions
- **Integration Tests**: No API integration tests
- **E2E Tests**: No comprehensive user flow tests
- **Performance Tests**: No memory leak testing
- **Accessibility Tests**: No automated a11y testing

## Code Quality Issues
- **Complexity**: Single file with 2350 lines (should be split)
- **State Management**: Multiple useState hooks (consider useReducer)
- **Error Handling**: Inconsistent error boundaries
- **Type Safety**: Some `any` types used
- **Code Duplication**: Repeated patterns in recording logic

## Migration Path
1. **Split Components**: Extract sub-components into separate files
2. **Add State Management**: Implement Zustand or Redux for complex state
3. **Database Integration**: Add media storage and metadata persistence
4. **Testing**: Comprehensive test suite implementation
5. **Performance**: Add virtualization for large recording lists
6. **Security**: Implement proper file validation and storage

## Recommended Architecture Improvements
1. **Component Extraction**: RecordingWindow, VideoPreview, EditingPanel, LibraryGrid
2. **Custom Hooks**: useRecording, useVideoEditing, useMediaLibrary
3. **Service Layer**: MediaService, RecordingService, ExportService
4. **State Management**: Centralized recording state with proper actions
5. **Error Boundaries**: Component-level error handling
6. **Loading States**: Skeleton components for better UX

This inventory provides a comprehensive foundation for the remaining audit phases.
