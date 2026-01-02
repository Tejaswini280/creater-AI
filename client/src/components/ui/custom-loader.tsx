import React from 'react';
import { cn } from '@/lib/utils';

interface CustomLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'dots' | 'bars' | 'ring';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'gray';
  message?: string;
  className?: string;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'blue',
  message,
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  };

  const renderSpinner = () => (
    <div className={cn("animate-spin rounded-full border-2 border-gray-200", sizeClasses[size])}>
      <div className={cn("rounded-full border-t-2", colorClasses[color], {
        'w-3 h-3': size === 'sm',
        'w-6 h-6': size === 'md',
        'w-10 h-10': size === 'lg',
        'w-14 h-14': size === 'xl'
      })} />
    </div>
  );

  const renderPulse = () => (
    <div className={cn("animate-pulse rounded-full", colorClasses[color], sizeClasses[size])} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-bounce",
            colorClasses[color],
            {
              'w-2 h-2': size === 'sm',
              'w-3 h-3': size === 'md',
              'w-4 h-4': size === 'lg',
              'w-5 h-5': size === 'xl'
            }
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  const renderBars = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-sm",
            colorClasses[color],
            {
              'w-1 h-4': size === 'sm',
              'w-1.5 h-6': size === 'md',
              'w-2 h-8': size === 'lg',
              'w-2.5 h-10': size === 'xl'
            }
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  const renderRing = () => (
    <div className={cn("relative", sizeClasses[size])}>
      <div className={cn("animate-spin rounded-full border-2 border-gray-200", sizeClasses[size])} />
      <div className={cn(
        "absolute top-0 left-0 animate-spin rounded-full border-2 border-t-transparent",
        colorClasses[color],
        sizeClasses[size]
      )} style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'pulse':
        return renderPulse();
      case 'dots':
        return renderDots();
      case 'bars':
        return renderBars();
      case 'ring':
        return renderRing();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      {renderLoader()}
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  variant?: CustomLoaderProps['variant'];
  color?: CustomLoaderProps['color'];
}> = ({ isVisible, message, variant = 'spinner', color = 'blue' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <CustomLoader
          size="lg"
          variant={variant}
          color={color}
          message={message}
        />
      </div>
    </div>
  );
};

export const InlineLoader: React.FC<{
  isVisible: boolean;
  message?: string;
  size?: CustomLoaderProps['size'];
  variant?: CustomLoaderProps['variant'];
  color?: CustomLoaderProps['color'];
}> = ({ isVisible, message, size = 'sm', variant = 'spinner', color = 'blue' }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2">
      <CustomLoader size={size} variant={variant} color={color} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

export const ButtonLoader: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: CustomLoaderProps['variant'];
  color?: CustomLoaderProps['color'];
}> = ({ isLoading, loadingText, children, variant = 'spinner', color = 'white' }) => {
  return (
    <div className="flex items-center space-x-2">
      {isLoading ? (
        <>
          <CustomLoader size="sm" variant={variant} color={color} />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </div>
  );
};
