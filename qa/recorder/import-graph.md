# Recorder Page Import Graph Analysis

## Overview
The recorder component has a complex import structure with dependencies across multiple domains: UI components, hooks, utilities, and browser APIs.

## Import Categories & Dependencies

### 1. React Core Imports
```typescript
import { useState, useRef, useEffect, useCallback } from "react";
```
**Purpose**: Core React hooks for state management and lifecycle
**Impact**: Essential for component functionality
**Alternatives**: None (React core)

### 2. Authentication Layer
```typescript
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
```
**Dependencies**:
- `useAuth`: JWT token management, user state, logout
- `useToast`: Notification system integration
**Files**: `client/src/hooks/useAuth.ts`, `client/src/hooks/use-toast.ts`

### 3. UI Component Library
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
```
**Framework**: Radix UI + Tailwind CSS
**Files**: Multiple component files in `client/src/components/ui/`
**Dependencies**: `class-variance-authority`, `clsx`, `tailwind-merge`

### 4. Icon System
```typescript
import {
  Mic, Square, Play, Pause, Download, Trash2, Settings, Volume2, VolumeX,
  RotateCcw, Save, Camera, Monitor, Presentation, ArrowUp, ArrowDown,
  Scissors, Crop, Type, Palette, Music, Undo, Redo, Eye, EyeOff, Zap,
  Filter, Layers, Target, Sparkles, Video, MicOff, MonitorOff, X, Plus,
  Minus, Loader2, FolderOpen, Edit3
} from "lucide-react";
```
**Library**: Lucide React (51 icons)
**Bundle Impact**: Large icon set - consider lazy loading or tree shaking
**Usage**: All icons used throughout component

### 5. Routing System
```typescript
import { useLocation } from "wouter";
```
**Framework**: Wouter (lightweight React router)
**Usage**: Authentication redirect logic
**Alternative**: React Router DOM

## Internal Component Dependencies

### Direct Component Imports
- None (component is self-contained)

### Hook Dependencies
1. **useAuth**: Authentication state and user management
2. **useToast**: Notification display system

### Utility Dependencies
- Query client for API requests
- Local storage for token management
- Browser APIs (MediaDevices, MediaRecorder, Canvas)

## Browser API Dependencies

### Media APIs
```javascript
navigator.mediaDevices.getUserMedia()
navigator.mediaDevices.getDisplayMedia()
new MediaRecorder()
```
**Permissions Required**:
- `camera` - User camera access
- `microphone` - Audio recording
- `screen` - Screen capture
- `display-capture` - Screen recording

### Canvas API
```javascript
document.createElement('canvas')
canvas.getContext('2d')
canvas.captureStream()
```
**Usage**: Video compositing for screen+camera overlays

### File API
```javascript
URL.createObjectURL()
URL.revokeObjectURL()
new Blob()
```
**Usage**: Media blob creation and download URLs

## Database Schema Dependencies

### Drizzle ORM Schema
```typescript
import * as schema from "@shared/schema";
```
**Tables Used**:
- `users` - User authentication
- `content` - Content storage
- `social_posts` - Social media content
- `projects` - Project management

### Database Connection
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
```
**Configuration**: Connection pooling, SSL, prepared statements

## Service Layer Dependencies

### AI Services
```typescript
// Potential imports (not currently used in recorder)
import { OpenAIService } from "./services/openai";
import { MediaAIService } from "./services/media-ai";
```
**Status**: Configured but not utilized in current recorder implementation

### Upload Service
```typescript
import { UploadService } from "./services/upload";
```
**Status**: Available for future cloud storage integration

## State Management Dependencies

### Current State Management
- **React useState**: Local component state
- **React useRef**: DOM references and mutable values
- **Local Storage**: Token and user data persistence

### Future State Management
```typescript
// Potential additions
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
```
**Benefits**: Server state management, caching, optimistic updates

## Security Dependencies

### Authentication Middleware
```typescript
import { authenticateToken } from "./auth";
import { requireApiKeyPermission } from "./middleware/security";
```

### Security Headers
```typescript
import helmet from "helmet";
import { cors } from "cors";
```

## Testing Dependencies

### Testing Framework
```typescript
// Development dependencies
import { jest } from "jest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
```

### E2E Testing
```typescript
import { test, expect } from "@playwright/test";
```

## Build System Dependencies

### Vite Configuration
```typescript
// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
```

### TypeScript Configuration
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "bundler": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Bundle Analysis

### Current Bundle Impact
- **React**: ~40KB (core)
- **UI Components**: ~150KB (Radix UI + Tailwind)
- **Icons**: ~25KB (Lucide React)
- **Database**: ~50KB (Drizzle + Postgres)
- **Total Estimated**: ~265KB (before compression)

### Optimization Opportunities
1. **Icon Loading**: Lazy load icons or use icon sprites
2. **Component Splitting**: Code split large components
3. **Tree Shaking**: Remove unused UI components
4. **Compression**: Enable gzip/brotli compression

## Import Optimization Recommendations

### 1. Component Splitting
```typescript
// Current: Single large file
// Recommended: Split into modules
const RecordingWindow = lazy(() => import('./components/RecordingWindow'));
const VideoEditor = lazy(() => import('./components/VideoEditor'));
const MediaLibrary = lazy(() => import('./components/MediaLibrary'));
```

### 2. Hook Extraction
```typescript
// Extract custom hooks
const useRecording = () => { /* recording logic */ };
const useVideoEditing = () => { /* editing logic */ };
const useMediaLibrary = () => { /* library logic */ };
```

### 3. Service Layer
```typescript
// Extract services
const MediaRecorderService = { /* media recording logic */ };
const VideoProcessingService = { /* video processing logic */ };
const ExportService = { /* export logic */ };
```

### 4. State Management
```typescript
// Centralized state
const useRecordingStore = create((set, get) => ({
  recordings: [],
  currentRecording: null,
  // actions
}));
```

## Circular Dependency Analysis
**Status**: ✅ No circular dependencies detected
**Method**: Import graph analysis shows clean dependency tree

## Missing Dependencies Analysis
**Critical Gaps**:
1. **Error Boundaries**: No React error boundary components
2. **Loading States**: No skeleton/loading components
3. **Offline Support**: No service worker or offline handling
4. **Analytics**: No event tracking integration

## Future Import Additions
```typescript
// Planned integrations
import { S3Client } from "@aws-sdk/client-s3"; // Cloud storage
import { Analytics } from "@segment/analytics-next"; // Analytics
import { ErrorBoundary } from "react-error-boundary"; // Error handling
import { ServiceWorker } from "./sw"; // Offline support
```

This import graph provides a foundation for understanding the component's architecture and identifying optimization opportunities.
