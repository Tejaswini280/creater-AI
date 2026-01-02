import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'pulse' | 'dots' | 'skeleton';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  className?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'text-primary'
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        color,
        className
      )}
    />
  );
};

interface LoadingDotsProps {
  size?: LoadingSize;
  className?: string;
  color?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  className,
  color = 'bg-primary'
}) => {
  const sizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            color
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
};

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 3,
  showAvatar = false
}) => {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 rounded"
            style={{ width: `${100 - (i * 10)}%` }}
          />
        ))}
      </div>
    </div>
  );
};

interface LoadingPulseProps {
  className?: string;
  children?: React.ReactNode;
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  className,
  children
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      {children || (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      )}
    </div>
  );
};

interface LoadingStateProps {
  type?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  className?: string;
  showText?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'md',
  text,
  className,
  showText = true
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return <LoadingSpinner size={size} />;
      case 'dots':
        return <LoadingDots size={size} />;
      case 'pulse':
        return <LoadingPulse />;
      case 'skeleton':
        return <LoadingSkeleton />;
      default:
        return <LoadingSpinner size={size} />;
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-4', className)}>
      {renderLoader()}
      {showText && text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  loadingType?: LoadingVariant;
  loadingSize?: LoadingSize;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  loadingType = 'spinner',
  loadingSize = 'sm',
  children,
  disabled,
  className,
  ...props
}) => {
  const renderLoadingIndicator = () => {
    switch (loadingType) {
      case 'spinner':
        return <LoadingSpinner size={loadingSize} className="mr-2" color="text-current" />;
      case 'dots':
        return <LoadingDots size={loadingSize} className="mr-2" color="bg-current" />;
      default:
        return <LoadingSpinner size={loadingSize} className="mr-2" color="text-current" />;
    }
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center',
        loading && 'cursor-not-allowed opacity-75',
        className
      )}
    >
      {loading && renderLoadingIndicator()}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};

// Status indicators
interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info';
  size?: LoadingSize;
  className?: string;
  text?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const statusConfig = {
    loading: {
      icon: LoadingSpinner,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    },
    warning: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    info: {
      icon: AlertCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn('rounded-full p-1', config.bgColor)}>
        <IconComponent className={cn(sizeClasses[size], config.color)} />
      </div>
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

// Export all loading components
export {
  LoadingSpinner,
  LoadingDots,
  LoadingSkeleton,
  LoadingPulse,
  LoadingState,
  LoadingButton,
  StatusIndicator
};
