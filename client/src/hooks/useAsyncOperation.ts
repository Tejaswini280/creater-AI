import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
}

interface UseAsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncOperation<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  options: UseAsyncOperationOptions = {}
) {
  const { toast } = useToast();
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (...args: Parameters<T>) => {
    setState({ isLoading: true, error: null });
    
    try {
      const result = await operation(...args);
      
      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        });
      }
      
      options.onSuccess?.(result);
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState({ isLoading: false, error: errorMessage });
      
      toast({
        title: "Error",
        description: options.errorMessage || errorMessage,
        variant: "destructive",
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [operation, options, toast]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  return {
    execute,
    reset,
    isLoading: state.isLoading,
    error: state.error,
  };
}