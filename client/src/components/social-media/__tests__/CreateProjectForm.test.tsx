import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateProjectForm from '../CreateProjectForm';

// Mock the API
vi.mock('@/lib/socialMediaApi', () => ({
  socialMediaApi: {
    aiContentApi: {
      generateAiContentSuggestion: vi.fn().mockResolvedValue({
        success: true,
        suggestions: ['Fitness enthusiasts aged 18-35', 'Young professionals interested in fitness']
      })
    },
    createProject: vi.fn().mockResolvedValue({
      success: true,
      project: { id: 1, name: 'Test Project' }
    })
  }
}));

// Mock the toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('CreateProjectForm', () => {
  const mockOnProjectCreate = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Check basic fields
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument();
    
    // Check multi-select fields
    expect(screen.getByText(/content type/i)).toBeInTheDocument();
    expect(screen.getByText(/content category/i)).toBeInTheDocument();
    expect(screen.getByText(/channel type/i)).toBeInTheDocument();
  });

  it('handles multi-select field changes correctly', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Click on a content type option
    const reelOption = screen.getByText('Reel');
    fireEvent.click(reelOption);
    
    // Check if the option is selected (has the selected styling)
    expect(reelOption.closest('button')).toHaveClass('border-purple-500');
    
    // Click on another content type option
    const postOption = screen.getByText('Post');
    fireEvent.click(postOption);
    
    // Both should be selected
    expect(reelOption.closest('button')).toHaveClass('border-purple-500');
    expect(postOption.closest('button')).toHaveClass('border-purple-500');
  });

  it('validates required fields correctly', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Try to submit without filling required fields
    const createButton = screen.getByText(/create project/i);
    fireEvent.click(createButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please select at least one content type/i)).toBeInTheDocument();
      expect(screen.getByText(/please select at least one content category/i)).toBeInTheDocument();
      expect(screen.getByText(/please select at least one channel type/i)).toBeInTheDocument();
    });
  });

  it('generates AI suggestions for target audience', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Fill in required fields to trigger AI suggestions
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'Fitness Journey' } });
    fireEvent.change(screen.getByLabelText(/content name/i), { target: { value: 'Workout Tips' } });
    
    // Select content category and channel type
    fireEvent.click(screen.getByText('Fitness'));
    fireEvent.click(screen.getByText('Instagram'));
    
    // Wait for AI suggestions to appear
    await waitFor(() => {
      expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument();
    });
  });

  it('handles form submission with valid data', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'Test Project' } });
    fireEvent.change(screen.getByLabelText(/project description/i), { target: { value: 'A test project description' } });
    fireEvent.change(screen.getByLabelText(/content name/i), { target: { value: 'Test Content' } });
    fireEvent.change(screen.getByLabelText(/content description/i), { target: { value: 'A test content description' } });
    fireEvent.change(screen.getByLabelText(/target audience/i), { target: { value: 'Test audience' } });
    
    // Select multi-select options
    fireEvent.click(screen.getByText('Reel'));
    fireEvent.click(screen.getByText('Fitness'));
    fireEvent.click(screen.getByText('Instagram'));
    
    // Submit form
    const createButton = screen.getByText(/create project/i);
    fireEvent.click(createButton);
    
    // Should not show validation errors
    await waitFor(() => {
      expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
    });
  });

  it('handles AI suggestion selection', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Fill in required fields to trigger AI suggestions
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'Fitness Journey' } });
    fireEvent.change(screen.getByLabelText(/content name/i), { target: { value: 'Workout Tips' } });
    fireEvent.click(screen.getByText('Fitness'));
    fireEvent.click(screen.getByText('Instagram'));
    
    // Wait for AI suggestions
    await waitFor(() => {
      expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument();
    });
    
    // Click on a suggestion
    const suggestion = screen.getByText('Fitness enthusiasts aged 18-35');
    fireEvent.click(suggestion);
    
    // Check if the target audience field is updated
    const targetAudienceInput = screen.getByLabelText(/target audience/i) as HTMLInputElement;
    expect(targetAudienceInput.value).toBe('Fitness enthusiasts aged 18-35');
  });

  it('shows loading state during AI generation', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Fill in required fields to trigger AI suggestions
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'Fitness Journey' } });
    fireEvent.change(screen.getByLabelText(/content name/i), { target: { value: 'Workout Tips' } });
    fireEvent.click(screen.getByText('Fitness'));
    fireEvent.click(screen.getByText('Instagram'));
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Generating AI suggestions/i)).toBeInTheDocument();
    });
  });

  it('handles duration selection correctly', () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Check duration options are present
    expect(screen.getByText('1 Week')).toBeInTheDocument();
    expect(screen.getByText('15 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    
    // Select a duration
    fireEvent.click(screen.getByText('15 Days'));
    expect(screen.getByText('15 Days').closest('button')).toHaveClass('border-purple-500');
  });

  it('handles custom duration correctly', () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Select custom duration
    fireEvent.click(screen.getByText('Custom'));
    
    // Should show custom date inputs
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('validates content name length', async () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Enter content name that's too short
    fireEvent.change(screen.getByLabelText(/content name/i), { target: { value: 'Hi' } });
    
    // Blur the field to trigger validation
    fireEvent.blur(screen.getByLabelText(/content name/i));
    
    await waitFor(() => {
      expect(screen.getByText(/content name must be at least 5 characters/i)).toBeInTheDocument();
    });
  });

  it('shows character count for text fields', () => {
    render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
    
    // Check character count displays
    expect(screen.getByText(/0\/150 characters/)).toBeInTheDocument();
    expect(screen.getByText(/0\/200 characters/)).toBeInTheDocument();
    
    // Type in content name
    fireEvent.change(screen.getByLabelText(/content name/i), { target: { value: 'Test' } });
    expect(screen.getByText(/4\/150 characters/)).toBeInTheDocument();
  });
});