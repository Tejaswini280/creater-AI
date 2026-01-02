# Recorder Page RBAC (Role-Based Access Control) Matrix

## Overview
The recorder page currently implements minimal access control. Authentication is required but there are no role-based permissions or feature restrictions.

## Current Authentication State

### Authentication Requirements
**Status**: ✅ Implemented
- **Route Protection**: `useAuth()` hook checks authentication on mount
- **Redirect Logic**: Unauthenticated users redirected to `/login`
- **Token Management**: JWT tokens with refresh mechanism
- **Session Persistence**: Local storage for token/user data

### Authentication Flow
```typescript
// Current implementation in recorder.tsx
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    setLocation('/login');
  }
}, [isAuthenticated, isLoading, setLocation]);
```

## Missing RBAC Implementation

### Role Definition Gaps
**Status**: ❌ Not Implemented
**Impact**: All authenticated users have identical permissions

**Required Roles**:
1. **Free User**: Basic recording, limited storage, watermarked exports
2. **Pro User**: Advanced features, higher quality, no watermarks
3. **Enterprise User**: Team collaboration, advanced analytics, priority support
4. **Admin**: System administration, user management

## Permission Matrix Analysis

### Current State (All Authenticated Users)
| Feature | Permission | Status | Notes |
|---------|------------|--------|-------|
| Access Recorder Page | ✅ Granted | Working | Basic auth check |
| Start Recording | ✅ Granted | Working | No restrictions |
| Save Recordings | ✅ Granted | Working | Client-side only |
| Edit Recordings | ✅ Granted | Working | No feature restrictions |
| Export Recordings | ✅ Granted | Working | No quality/size limits |
| Delete Recordings | ✅ Granted | Working | No ownership checks |
| Access All Recording Types | ✅ Granted | Working | Camera, screen, audio all available |

### Proposed RBAC Matrix

#### User Roles
1. **free** - Basic tier user
2. **pro** - Premium tier user
3. **enterprise** - Enterprise tier user
4. **admin** - System administrator

#### Feature Permissions Matrix

| Feature | Free | Pro | Enterprise | Admin | Notes |
|---------|------|-----|------------|-------|-------|
| **Page Access** | ✅ | ✅ | ✅ | ✅ | Basic authentication required |
| **Basic Recording** | ✅ | ✅ | ✅ | ✅ | Camera, audio, screen recording |
| **Recording Quality** | 720p | 1080p | 4K | 4K | Quality limitations |
| **Recording Duration** | 5min | 30min | Unlimited | Unlimited | Time restrictions |
| **Storage Limit** | 1GB | 10GB | 100GB | Unlimited | Storage quotas |
| **Export Formats** | WebM | All | All | All | Format restrictions |
| **Watermark** | ✅ | ❌ | ❌ | ❌ | Branding on exports |
| **Advanced Editing** | ❌ | ✅ | ✅ | ✅ | Filters, effects, text overlays |
| **Team Collaboration** | ❌ | ❌ | ✅ | ✅ | Shared projects, comments |
| **API Access** | ❌ | ❌ | ✅ | ✅ | Programmatic access |
| **Analytics** | Basic | Advanced | Advanced | Full | Usage analytics |
| **Priority Support** | ❌ | ✅ | ✅ | ✅ | Support tiers |
| **Custom Branding** | ❌ | ❌ | ✅ | ✅ | White-label options |

## Implementation Requirements

### 1. User Role Schema Extension
**Status**: ❌ Missing
**Required Changes**:

```sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'free'
  CHECK (role IN ('free', 'pro', 'enterprise', 'admin'));

-- Add subscription metadata
ALTER TABLE users ADD COLUMN subscription JSONB;

-- Create role-based indexes
CREATE INDEX idx_users_role ON users(role);
```

### 2. Permission Middleware
**Status**: ❌ Missing
**Required Implementation**:

```typescript
// Permission checking utility
export const checkPermission = (userRole: string, feature: string, action: string): boolean => {
  const permissions = PERMISSION_MATRIX[userRole];
  return permissions?.[feature]?.[action] || false;
};

// React hook for permission checking
export const usePermission = (feature: string, action: string = 'access') => {
  const { user } = useAuth();
  return checkPermission(user?.role || 'free', feature, action);
};
```

### 3. Feature Guards
**Status**: ❌ Missing
**Required Implementation**:

```typescript
// Component-level feature guard
export const FeatureGuard: React.FC<{
  feature: string;
  action?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ feature, action = 'access', fallback, children }) => {
  const hasPermission = usePermission(feature, action);

  if (!hasPermission) {
    return fallback || <PermissionDenied feature={feature} />;
  }

  return <>{children}</>;
};
```

## Feature Flag Implementation

### Current Feature Flags
**Status**: ❌ Not Implemented
**Impact**: All features enabled for all users

### Required Feature Flags
```typescript
// Feature flag configuration
export const FEATURE_FLAGS = {
  // Recording features
  ADVANCED_EDITING: 'advanced_editing',
  HIGH_QUALITY_RECORDING: 'high_quality_recording',
  UNLIMITED_DURATION: 'unlimited_duration',

  // Collaboration features
  TEAM_COLLABORATION: 'team_collaboration',
  SHARED_PROJECTS: 'shared_projects',

  // Export features
  MULTI_FORMAT_EXPORT: 'multi_format_export',
  NO_WATERMARK: 'no_watermark',

  // Storage features
  CLOUD_STORAGE: 'cloud_storage',
  LARGE_STORAGE: 'large_storage',

  // AI features
  AI_ENHANCEMENT: 'ai_enhancement',
  AUTO_TRANSCRIPTION: 'auto_transcription'
};

// Feature flag by role mapping
export const ROLE_FEATURES = {
  free: [
    // Basic features only
  ],
  pro: [
    FEATURE_FLAGS.ADVANCED_EDITING,
    FEATURE_FLAGS.HIGH_QUALITY_RECORDING,
    FEATURE_FLAGS.MULTI_FORMAT_EXPORT
  ],
  enterprise: [
    // All pro features plus
    FEATURE_FLAGS.TEAM_COLLABORATION,
    FEATURE_FLAGS.UNLIMITED_DURATION,
    FEATURE_FLAGS.NO_WATERMARK,
    FEATURE_FLAGS.AI_ENHANCEMENT
  ],
  admin: [
    // All features
    ...Object.values(FEATURE_FLAGS)
  ]
};
```

## UI Implementation Strategy

### 1. Permission-Based UI Rendering
```typescript
// Recording options with permissions
const RECORDING_OPTIONS = [
  {
    id: 'camera',
    title: 'Camera',
    icon: Camera,
    permission: 'basic_recording'
  },
  {
    id: 'screen-camera',
    title: 'Screen & Camera',
    icon: Monitor,
    permission: 'advanced_recording' // Pro+ feature
  }
];

// Render with permission checks
{RECORDING_OPTIONS.map(option => (
  <FeatureGuard
    key={option.id}
    feature={option.permission}
    fallback={
      <div className="p-6 border-2 border-gray-200 rounded-xl opacity-50">
        <div className="text-center">
          <option.icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-500">{option.title}</h3>
          <p className="text-sm text-gray-400">Pro feature</p>
        </div>
      </div>
    }
  >
    {/* Full recording option */}
  </FeatureGuard>
))}
```

### 2. Quality Restrictions
```typescript
// Quality options based on role
const getAvailableQualities = (userRole: string) => {
  switch (userRole) {
    case 'free': return ['low', 'medium'];
    case 'pro': return ['low', 'medium', 'high'];
    default: return ['low', 'medium', 'high'];
  }
};
```

### 3. Storage Limit Enforcement
```typescript
// Storage usage tracking
const checkStorageLimit = async (userId: string, newFileSize: number) => {
  const currentUsage = await getUserStorageUsage(userId);
  const limit = getStorageLimit(user.role);

  if (currentUsage + newFileSize > limit) {
    throw new Error('Storage limit exceeded');
  }
};
```

## Security Implementation

### 1. Server-Side Permission Checks
**Status**: ❌ Missing
**Required**: All client permissions must be verified server-side

```typescript
// API endpoint permission middleware
export const requirePermission = (feature: string, action: string = 'access') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'free';
    const hasPermission = checkPermission(userRole, feature, action);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        feature,
        action,
        requiredRole: getRequiredRole(feature, action)
      });
    }

    next();
  };
};
```

### 2. Data Access Control
**Status**: ❌ Missing
**Required**: Row-level security for user data

```sql
-- Row Level Security policies
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY recordings_user_access ON recordings
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY recordings_admin_access ON recordings
  FOR ALL USING (current_user_role() = 'admin');
```

## Multi-Tenancy Considerations

### Current State
**Status**: ❌ Not Implemented
**Impact**: No tenant isolation

### Required Implementation
```typescript
// Tenant context
export const useTenant = () => {
  const { user } = useAuth();
  return {
    tenantId: user?.tenantId,
    isEnterprise: user?.role === 'enterprise'
  };
};

// Tenant-scoped queries
const getTenantRecordings = async (tenantId: string) => {
  return await db
    .select()
    .from(recordings)
    .where(eq(recordings.tenantId, tenantId));
};
```

## Implementation Plan

### Phase 1: Basic RBAC (Week 1-2)
1. Add role column to users table
2. Implement permission checking utilities
3. Add feature guards to critical features
4. Update UI to show permission restrictions

### Phase 2: Advanced Features (Week 3-4)
1. Implement storage limits
2. Add quality restrictions
3. Create subscription management
4. Add server-side permission checks

### Phase 3: Enterprise Features (Week 5-6)
1. Implement multi-tenancy
2. Add team collaboration features
3. Create admin management tools
4. Implement audit logging

## Testing Strategy

### Permission Testing
```typescript
// Test permission matrix
describe('Permission System', () => {
  test('Free user cannot access pro features', () => {
    expect(checkPermission('free', 'advanced_editing', 'access')).toBe(false);
  });

  test('Pro user can access basic features', () => {
    expect(checkPermission('pro', 'basic_recording', 'access')).toBe(true);
  });
});
```

### UI Testing
```typescript
// Test feature guards
describe('Feature Guards', () => {
  test('Pro features show upgrade prompt for free users', () => {
    render(<RecordingOptions userRole="free" />);
    expect(screen.getByText('Pro feature')).toBeInTheDocument();
  });
});
```

## Migration Strategy

### Data Migration
```sql
-- Add role column with default
ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'free';

-- Update existing users based on subscription data
UPDATE users SET role = 'pro' WHERE subscription->>'tier' = 'pro';
UPDATE users SET role = 'enterprise' WHERE subscription->>'tier' = 'enterprise';
```

### Backward Compatibility
```typescript
// Feature flag for gradual rollout
const USE_RBAC = process.env.USE_RBAC === 'true';

if (USE_RBAC) {
  // New permission-based logic
} else {
  // Legacy unrestricted access
}
```

## Risk Assessment

### High Risk Areas
1. **Data Migration**: Incorrect role assignments
2. **Breaking Changes**: Existing users lose access
3. **Performance Impact**: Permission checks on every action
4. **User Experience**: Abrupt feature restrictions

### Mitigation Strategies
1. **Gradual Rollout**: Feature flags for controlled deployment
2. **Default Permissions**: Maintain backward compatibility
3. **Clear Communication**: User notifications about changes
4. **Support Resources**: Help documentation for upgrades

## Success Criteria

### Functional Requirements
- ✅ Role-based feature access working
- ✅ Permission checks on all sensitive operations
- ✅ Storage limits enforced
- ✅ Quality restrictions applied
- ✅ UI reflects user permissions accurately

### Security Requirements
- ✅ Server-side permission verification
- ✅ Data access control implemented
- ✅ Audit logging for permission changes
- ✅ No privilege escalation vulnerabilities

### User Experience Requirements
- ✅ Clear upgrade prompts for restricted features
- ✅ Seamless experience for entitled users
- ✅ Helpful error messages for permission denials
- ✅ Easy upgrade path for feature access

This RBAC matrix provides a comprehensive framework for implementing role-based access control and feature restrictions in the recorder component.
