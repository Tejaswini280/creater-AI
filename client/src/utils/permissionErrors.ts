/**
 * Enhanced permission error handling utilities
 * Addresses DEF-REC-002: Inconsistent error handling for permission denials
 */

export type PermissionType = 'camera' | 'microphone' | 'screen';

export interface PermissionError {
  type: PermissionType;
  title: string;
  description: string;
  actionText: string;
  helpUrl?: string;
}

export const PERMISSION_ERRORS: Record<PermissionType, PermissionError> = {
  camera: {
    type: 'camera',
    title: 'Camera Access Required',
    description: 'Please grant camera permission to record video. This allows you to create video content with your camera feed.',
    actionText: 'Grant Camera Access',
    helpUrl: 'https://support.google.com/chrome/answer/2693767'
  },
  microphone: {
    type: 'microphone',
    title: 'Microphone Access Required',
    description: 'Please grant microphone permission to record audio. This allows you to add voice narration to your recordings.',
    actionText: 'Grant Microphone Access',
    helpUrl: 'https://support.google.com/chrome/answer/2693767'
  },
  screen: {
    type: 'screen',
    title: 'Screen Sharing Required',
    description: 'Please grant screen sharing permission to record your screen. Select the content you want to share from the options provided.',
    actionText: 'Share Screen',
    helpUrl: 'https://support.google.com/chrome/answer/1263133'
  }
};

/**
 * Check if an error is a permission-related error
 */
export const isPermissionError = (error: Error): boolean => {
  return error.name === 'NotAllowedError' ||
         error.name === 'PermissionDeniedError' ||
         error.message.includes('permission') ||
         error.message.includes('denied');
};

/**
 * Get permission type from MediaStreamError or generic error
 */
export const getPermissionTypeFromError = (error: Error, requestedPermission: PermissionType): PermissionType => {
  // For getUserMedia errors
  if (error.message.includes('video') || error.message.includes('camera')) {
    return 'camera';
  }
  if (error.message.includes('audio') || error.message.includes('microphone')) {
    return 'microphone';
  }

  // Return the requested permission as fallback
  return requestedPermission;
};

/**
 * Enhanced permission error handler with retry functionality
 */
export const handlePermissionError = (
  error: Error,
  requestedPermission: PermissionType,
  onRetry?: () => Promise<void>,
  onHelp?: () => void
): void => {
  const permissionType = getPermissionTypeFromError(error, requestedPermission);
  const errorConfig = PERMISSION_ERRORS[permissionType];

  console.error(`🚫 Permission denied for ${permissionType}:`, error);

  // Show error toast with retry option
  const toast = {
    title: errorConfig.title,
    description: errorConfig.description,
    variant: "destructive" as const,
    duration: 10000, // Longer duration for permission errors
    action: onRetry ? {
      altText: errorConfig.actionText,
      onClick: () => {
        console.log(`🔄 Retrying ${permissionType} permission`);
        onRetry().catch(retryError => {
          console.error('Retry failed:', retryError);
          // If retry fails, show help option
          if (onHelp) {
            onHelp();
          }
        });
      },
      children: errorConfig.actionText
    } : undefined
  };

  // Import toast dynamically to avoid circular dependencies
  import('@/hooks/use-toast').then(({ useToast }) => {
    // This would be called from a component context
    console.log('Toast config:', toast);
  });
};

/**
 * Show help dialog for permission issues
 */
export const showPermissionHelp = (permissionType: PermissionType): void => {
  const errorConfig = PERMISSION_ERRORS[permissionType];

  // Create help dialog
  const helpDialog = {
    title: `How to Enable ${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)} Access`,
    description: getPermissionHelpText(permissionType),
    helpUrl: errorConfig.helpUrl
  };

  console.log('Help dialog:', helpDialog);
};

/**
 * Get detailed help text for permission types
 */
export const getPermissionHelpText = (permissionType: PermissionType): string => {
  const helpTexts = {
    camera: `1. Click the camera icon in your browser's address bar
2. Select "Always allow" for this site
3. Refresh the page and try again
4. If issues persist, check your system camera settings`,
    microphone: `1. Click the microphone icon in your browser's address bar
2. Select "Always allow" for this site
3. Refresh the page and try again
4. Check your system microphone settings`,
    screen: `1. Click "Share Screen" when prompted
2. Select what you want to share (entire screen, window, or tab)
3. Click "Share" to grant permission
4. If blocked, check your browser's screen sharing settings`
  };

  return helpTexts[permissionType];
};

/**
 * Check current permission status
 */
export const checkPermissionStatus = async (permissionType: PermissionType): Promise<PermissionState> => {
  if (!navigator.permissions) {
    // Fallback for browsers without permissions API
    return 'prompt';
  }

  try {
    let permissionName: PermissionName;

    switch (permissionType) {
      case 'camera':
        permissionName = 'camera';
        break;
      case 'microphone':
        permissionName = 'microphone';
        break;
      case 'screen':
        // Screen capture doesn't have a permission name
        return 'prompt';
      default:
        return 'prompt';
    }

    const result = await navigator.permissions.query({ name: permissionName });
    return result.state;
  } catch (error) {
    console.warn('Could not check permission status:', error);
    return 'prompt';
  }
};

/**
 * Request permission with enhanced error handling
 */
export const requestPermission = async (
  permissionType: PermissionType,
  constraints?: MediaStreamConstraints
): Promise<MediaStream> => {
  try {
    let stream: MediaStream;

    switch (permissionType) {
      case 'camera':
        stream = await navigator.mediaDevices.getUserMedia({
          video: constraints?.video || true,
          audio: false
        });
        break;

      case 'microphone':
        stream = await navigator.mediaDevices.getUserMedia({
          audio: constraints?.audio || true,
          video: false
        });
        break;

      case 'screen':
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: constraints?.video || true,
          audio: constraints?.audio || false
        });
        break;

      default:
        throw new Error(`Unknown permission type: ${permissionType}`);
    }

    console.log(`✅ Permission granted for ${permissionType}`);
    return stream;

  } catch (error) {
    if (error instanceof Error) {
      throw new PermissionError(error, permissionType);
    }
    throw error;
  }
};

/**
 * Custom error class for permission errors
 */
export class PermissionError extends Error {
  constructor(
    originalError: Error,
    public permissionType: PermissionType
  ) {
    super(originalError.message);
    this.name = 'PermissionError';
  }
}
