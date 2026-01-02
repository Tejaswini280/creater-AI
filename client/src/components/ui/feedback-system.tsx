import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface FeedbackSystemProps {
  feedbacks: FeedbackItem[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const FeedbackItem: React.FC<{
  feedback: FeedbackItem;
  onRemove: (id: string) => void;
}> = ({ feedback, onRemove }) => {
  const { id, type, title, description, duration = 5000, action } = feedback;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-900',
          progressClass: 'bg-green-500'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-900',
          progressClass: 'bg-red-500'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          bgClass: 'bg-yellow-50 border-yellow-200',
          textClass: 'text-yellow-900',
          progressClass: 'bg-yellow-500'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-900',
          progressClass: 'bg-blue-500'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "relative max-w-sm w-full p-4 rounded-lg border shadow-lg backdrop-blur-sm",
        config.bgClass
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-semibold", config.textClass)}>
            {title}
          </h4>
          {description && (
            <p className={cn("text-sm mt-1 opacity-90", config.textClass)}>
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "text-sm font-medium underline mt-2 hover:opacity-80",
                config.textClass
              )}
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(id)}
          className={cn(
            "flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors",
            config.textClass
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={cn("absolute bottom-0 left-0 h-1 rounded-b-lg", config.progressClass)}
        />
      )}
    </motion.div>
  );
};

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  feedbacks,
  onRemove,
  position = 'top-right'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={cn("fixed z-50 pointer-events-none", getPositionClasses())}>
      <div className="space-y-3 pointer-events-auto">
        <AnimatePresence>
          {feedbacks.map((feedback) => (
            <FeedbackItem
              key={feedback.id}
              feedback={feedback}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Hook for managing feedback
export const useFeedback = () => {
  const [feedbacks, setFeedbacks] = React.useState<FeedbackItem[]>([]);

  const addFeedback = (feedback: Omit<FeedbackItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newFeedback = { ...feedback, id };

    setFeedbacks(prev => [...prev, newFeedback]);

    return id;
  };

  const removeFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFeedbacks([]);
  };

  return {
    feedbacks,
    addFeedback,
    removeFeedback,
    clearAll,
    success: (title: string, description?: string, options?: Partial<FeedbackItem>) =>
      addFeedback({ type: 'success', title, description, ...options }),
    error: (title: string, description?: string, options?: Partial<FeedbackItem>) =>
      addFeedback({ type: 'error', title, description, ...options }),
    warning: (title: string, description?: string, options?: Partial<FeedbackItem>) =>
      addFeedback({ type: 'warning', title, description, ...options }),
    info: (title: string, description?: string, options?: Partial<FeedbackItem>) =>
      addFeedback({ type: 'info', title, description, ...options })
  };
};

// Inline feedback component for forms
export const InlineFeedback: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}> = ({ type, message, className }) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-800'
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-800'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
          bgClass: 'bg-yellow-50 border-yellow-200',
          textClass: 'text-yellow-800'
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-600" />,
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-800'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center space-x-2 p-3 rounded-lg border text-sm",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {config.icon}
      <span>{message}</span>
    </motion.div>
  );
};

// Loading state with feedback
export const LoadingState: React.FC<{
  isLoading: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isLoading, loadingMessage, children, size = 'md' }) => {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center rounded-lg"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className={cn(
                  "border-2 border-blue-600 border-t-transparent rounded-full mx-auto",
                  {
                    'w-6 h-6': size === 'sm',
                    'w-8 h-8': size === 'md',
                    'w-12 h-12': size === 'lg'
                  }
                )}
              />
              {loadingMessage && (
                <p className="text-sm text-gray-600 mt-2">{loadingMessage}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
