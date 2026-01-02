import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  touched: Record<string, boolean>;
}

export interface UseFormValidationOptions<T> {
  initialData: T;
  schema?: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T = any>({
  initialData,
  schema,
  validateOnChange = true,
  validateOnBlur = true
}: UseFormValidationOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: [],
    isValid: !schema || validateData(initialData, schema).length === 0,
    isSubmitting: false,
    touched: {}
  });

  const validateData = useCallback((data: T, validationSchema?: z.ZodSchema): ValidationError[] => {
    if (!validationSchema) return [];

    try {
      validationSchema.parse(data);
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
      }
      return [{ field: 'general', message: 'Validation failed' }];
    }
  }, []);

  const validateField = useCallback((field: string, value: any): ValidationError | null => {
    if (!schema) return null;

    try {
      // Create a partial schema for the field
      const fieldSchema = (schema as any).shape?.[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        return null;
      }
    } catch (error) {
      if (error instanceof z.ZodError && error.errors.length > 0) {
        const fieldError = error.errors[0];
        return {
          field,
          message: fieldError.message,
          code: fieldError.code
        };
      }
    }
    return null;
  }, [schema]);

  const updateField = useCallback((field: string, value: any) => {
    setFormState(prev => {
      const newData = { ...prev.data, [field]: value };
      const newErrors = prev.errors.filter(error => error.field !== field);

      // Validate field if configured
      if (validateOnChange) {
        const fieldError = validateField(field, value);
        if (fieldError) {
          newErrors.push(fieldError);
        }
      }

      // Validate entire form if schema provided
      const allErrors = schema ? validateData(newData, schema) : newErrors;
      const isValid = allErrors.length === 0;

      return {
        ...prev,
        data: newData,
        errors: allErrors,
        isValid
      };
    });
  }, [validateOnChange, validateField, validateData, schema]);

  const setFieldTouched = useCallback((field: string, touched = true) => {
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched }
    }));

    // Validate on blur if configured
    if (touched && validateOnBlur && schema) {
      setFormState(prev => {
        const fieldError = validateField(field, prev.data[field as keyof T]);
        const newErrors = prev.errors.filter(error => error.field !== field);

        if (fieldError) {
          newErrors.push(fieldError);
        }

        const allErrors = validateData(prev.data, schema);
        const isValid = allErrors.length === 0;

        return {
          ...prev,
          errors: allErrors,
          isValid
        };
      });
    }
  }, [validateOnBlur, validateField, validateData, schema]);

  const setErrors = useCallback((errors: ValidationError[]) => {
    setFormState(prev => ({
      ...prev,
      errors,
      isValid: errors.length === 0
    }));
  }, []);

  const clearErrors = useCallback((field?: string) => {
    setFormState(prev => ({
      ...prev,
      errors: field
        ? prev.errors.filter(error => error.field !== field)
        : [],
      isValid: field
        ? (prev.errors.filter(error => error.field !== field).length === 0)
        : true
    }));
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    if (!schema) return true;

    const errors = validateData(formState.data, schema);
    setFormState(prev => ({
      ...prev,
      errors,
      isValid: errors.length === 0
    }));

    return errors.length === 0;
  }, [schema, validateData, formState.data]);

  const submit = useCallback(async <R = any>(
    submitFn: (data: T) => Promise<R>
  ): Promise<{ success: boolean; data?: R; errors?: ValidationError[] }> => {
    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Validate before submission
      const isValid = await validate();
      if (!isValid) {
        return { success: false, errors: formState.errors };
      }

      const result = await submitFn(formState.data);
      return { success: true, data: result };
    } catch (error) {
      const submitError: ValidationError = {
        field: 'general',
        message: error instanceof Error ? error.message : 'Submission failed'
      };
      setErrors([submitError]);
      return { success: false, errors: [submitError] };
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [validate, formState.errors, formState.data, setErrors]);

  const reset = useCallback((newData?: Partial<T>) => {
    const resetData = newData ? { ...initialData, ...newData } : initialData;
    setFormState({
      data: resetData,
      errors: [],
      isValid: !schema || validateData(resetData, schema).length === 0,
      isSubmitting: false,
      touched: {}
    });
  }, [initialData, schema, validateData]);

  const getFieldError = useCallback((field: string): string | undefined => {
    const error = formState.errors.find(err => err.field === field);
    return error?.message;
  }, [formState.errors]);

  const isFieldTouched = useCallback((field: string): boolean => {
    return !!formState.touched[field];
  }, [formState.touched]);

  const isFieldValid = useCallback((field: string): boolean => {
    return !formState.errors.some(err => err.field === field);
  }, [formState.errors]);

  return {
    // State
    data: formState.data,
    errors: formState.errors,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    touched: formState.touched,

    // Actions
    updateField,
    setFieldTouched,
    setErrors,
    clearErrors,
    validate,
    submit,
    reset,

    // Helpers
    getFieldError,
    isFieldTouched,
    isFieldValid
  };
}

// Specialized hooks for common use cases
export function useContentForm(initialData: any) {
  const contentSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().max(2000, 'Description too long').optional(),
    script: z.string().optional(),
    platform: z.string().min(1, 'Platform is required'),
    contentType: z.enum(['video', 'image', 'text', 'reel', 'short']),
    scheduledAt: z.string().optional().refine((val) => {
      if (!val) return true;
      return new Date(val) > new Date();
    }, 'Scheduled time must be in the future'),
    tags: z.array(z.string()).max(50, 'Maximum 50 tags').optional()
  });

  return useFormValidation({
    initialData,
    schema: contentSchema
  });
}

export function useProjectForm(initialData: any) {
  const projectSchema = z.object({
    name: z.string().min(3, 'Project name too short').max(100, 'Project name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    type: z.enum(['video', 'audio', 'image', 'script', 'campaign']),
    status: z.enum(['active', 'completed', 'archived']).default('active'),
    tags: z.array(z.string()).max(20, 'Maximum 20 tags').optional()
  });

  return useFormValidation({
    initialData,
    schema: projectSchema
  });
}

export function useSocialPostForm(initialData: any) {
  const socialPostSchema = z.object({
    title: z.string().min(5, 'Title too short').max(200, 'Title too long'),
    caption: z.string().max(3000, 'Caption too long').optional(),
    hashtags: z.array(z.string()).max(30, 'Maximum 30 hashtags').optional(),
    emojis: z.array(z.string()).max(20, 'Maximum 20 emojis').optional(),
    contentType: z.enum(['post', 'reel', 'short', 'story', 'video']),
    scheduledAt: z.string().optional().refine((val) => {
      if (!val) return true;
      return new Date(val) > new Date();
    }, 'Scheduled time must be in the future')
  });

  return useFormValidation({
    initialData,
    schema: socialPostSchema
  });
}
