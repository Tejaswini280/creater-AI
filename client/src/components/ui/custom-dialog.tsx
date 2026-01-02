import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomLoader } from './custom-loader';
import { AlertTriangle, CheckCircle, XCircle, Info, Trash2, Pause, Play, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon,
  isLoading = false,
  loadingMessage = 'Processing...'
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: icon || <XCircle className="w-6 h-6 text-red-600" />,
          confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
          borderClass: 'border-red-200',
          bgClass: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: icon || <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          borderClass: 'border-yellow-200',
          bgClass: 'bg-yellow-50'
        };
      case 'success':
        return {
          icon: icon || <CheckCircle className="w-6 h-6 text-green-600" />,
          confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white',
          borderClass: 'border-green-200',
          bgClass: 'bg-green-50'
        };
      default:
        return {
          icon: icon || <Info className="w-6 h-6 text-blue-600" />,
          confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          borderClass: 'border-blue-200',
          bgClass: 'bg-blue-50'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md", config.borderClass)}>
        <DialogHeader>
          <div className={cn("flex items-center space-x-3 p-4 rounded-lg", config.bgClass)}>
            {config.icon}
            <div>
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <CustomLoader
              size="md"
              variant="spinner"
              message={loadingMessage}
            />
          </div>
        ) : (
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={config.confirmButtonClass}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Specialized confirmation dialogs for common actions
export const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType, isLoading }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Delete ${itemType}`}
    description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
    confirmText="Delete"
    cancelText="Cancel"
    type="danger"
    icon={<Trash2 className="w-6 h-6" />}
    isLoading={isLoading}
    loadingMessage="Deleting..."
  />
);

export const StopConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, isLoading }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Stop Content"
    description={`Are you sure you want to stop publishing "${itemName}"? The content will be moved to draft status.`}
    confirmText="Stop Publishing"
    cancelText="Cancel"
    type="warning"
    icon={<Pause className="w-6 h-6" />}
    isLoading={isLoading}
    loadingMessage="Stopping..."
  />
);

export const PauseConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, isLoading }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Pause Content"
    description={`Pause publishing "${itemName}"? It will be temporarily stopped but can be resumed later.`}
    confirmText="Pause"
    cancelText="Cancel"
    type="warning"
    icon={<Pause className="w-6 h-6" />}
    isLoading={isLoading}
    loadingMessage="Pausing..."
  />
);

export const ResumeConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, isLoading }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Resume Content"
    description={`Resume publishing "${itemName}"? The content will continue publishing according to the schedule.`}
    confirmText="Resume"
    cancelText="Cancel"
    type="success"
    icon={<Play className="w-6 h-6" />}
    isLoading={isLoading}
    loadingMessage="Resuming..."
  />
);

export const ExtendConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  currentDuration: string;
  newDuration: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, projectName, currentDuration, newDuration, isLoading }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Extend Project Duration"
    description={`Extend "${projectName}" from ${currentDuration} to ${newDuration}? Additional content will be scheduled automatically.`}
    confirmText="Extend Project"
    cancelText="Cancel"
    type="info"
    icon={<Clock className="w-6 h-6" />}
    isLoading={isLoading}
    loadingMessage="Extending project..."
  />
);

export const RegenerateConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName, isLoading }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Regenerate Content"
    description={`Regenerate "${itemName}" with AI? The current content will be replaced with AI-generated suggestions.`}
    confirmText="Regenerate"
    cancelText="Cancel"
    type="info"
    icon={<RotateCcw className="w-6 h-6" />}
    isLoading={isLoading}
    loadingMessage="Regenerating..."
  />
);

// Success/Error feedback dialogs
export const SuccessDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}> = ({ isOpen, onClose, title, description, autoClose = true, autoCloseDelay = 3000 }) => {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-green-200">
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <DialogTitle className="text-lg font-semibold text-green-900">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-green-700">
              {description}
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ErrorDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details?: string;
}> = ({ isOpen, onClose, title, description, details }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md border-red-200">
      <DialogHeader>
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50">
          <XCircle className="w-8 h-8 text-red-600" />
          <div>
            <DialogTitle className="text-lg font-semibold text-red-900">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-red-700">
              {description}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {details && (
        <div className="px-4 pb-4">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium">Technical Details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {details}
            </pre>
          </details>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
