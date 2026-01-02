import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateProjectForm from '../../components/social-media/CreateProjectForm';
import { socialMediaApi } from '../../lib/socialMediaApi';

// Mock the API responses
const mockApiResponses = {
  generateAiContentSuggestion: vi.fn().mockResolvedValue({
    success: true,
    suggestions: ['Fitness enthusiasts aged 18-35', 'Young professionals interested in fitness']
  }),
  createProject: vi.fn().mockResolvedValue({
    success: true,
    project: { id: 1, name: 'Test Project' }
  }),
  optimizeSchedule: vi.fn().mockResolvedValue({
    success: true,
    data: {
      optimizedSchedule: [
        {
          time: '09:00',
          engagementScore: 85,
          reasoning: 'Peak morning engagement',
          platform: 'instagram',
          category: 'fitness'
        }
      ],
      insights: {
        bestPerformingTimes: ['09:00', '18:00'],
        platformRecommendations: {
          instagram: ['09:00', '18:00', '20:00']
        },
        categoryInsights: {
          fitness: 'Excellent performance expected for fitness content'
        }
      }
    }
  })
};

// Mock the API
vi.mock('../../lib/socialMediaApi', () => ({
  socialMediaApi: {
    aiContentApi: mockApiResponses,
    createProject: mockApiResponses.createProject,
    optimizeSchedule: mockApiResponses.optimizeSchedule
  }
}));

// Mock the toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Social Media Platform Integration', () => {
  const mockOnProjectCreate = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Project Creation Flow', () => {
    it('should create a project with AI-generated content and optimized calendar', async () => {
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Fill in project details
      fireEvent.change(screen.getByLabelText(/project name/i), { 
        target: { value: 'Fitness Transformation Journey' } 
      });
      fireEvent.change(screen.getByLabelText(/project description/i), { 
        target: { value: 'A comprehensive fitness journey for beginners' } 
      });
      fireEvent.change(screen.getByLabelText(/content name/i), { 
        target: { value: 'Daily Workout Tips' } 
      });
      fireEvent.change(screen.getByLabelText(/content description/i), { 
        target: { value: 'Daily tips and exercises for fitness beginners' } 
      });
      
      // Select content types
      fireEvent.click(screen.getByText('Reel'));
      fireEvent.click(screen.getByText('Post'));
      
      // Select content categories
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByText('Health'));
      
      // Select channel types
      fireEvent.click(screen.getByText('Instagram'));
      fireEvent.click(screen.getByText('TikTok'));
      
      // Wait for AI suggestions to appear
      await waitFor(() => {
        expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument();
      });
      
      // Select an AI suggestion
      const suggestion = screen.getByText('Fitness enthusiasts aged 18-35');
      fireEvent.click(suggestion);
      
      // Select duration
      fireEvent.click(screen.getByText('30 Days'));
      
      // Submit the form
      const createButton = screen.getByText(/create project/i);
      fireEvent.click(createButton);
      
      // Wait for project creation
      await waitFor(() => {
        expect(mockApiResponses.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Fitness Transformation Journey',
            description: 'A comprehensive fitness journey for beginners',
            type: 'social-media',
            platform: 'Instagram, TikTok',
            targetAudience: 'Fitness enthusiasts aged 18-35',
            estimatedDuration: '30days',
            metadata: expect.objectContaining({
              contentType: ['reel', 'post'],
              contentCategory: ['fitness', 'health'],
              contentName: 'Daily Workout Tips',
              channelType: ['instagram', 'tiktok']
            })
          })
        );
      });
    });

    it('should handle AI content generation and calendar optimization', async () => {
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Fill in minimal required fields
      fireEvent.change(screen.getByLabelText(/project name/i), { 
        target: { value: 'Tech Tutorial Series' } 
      });
      fireEvent.change(screen.getByLabelText(/content name/i), { 
        target: { value: 'React Basics' } 
      });
      fireEvent.change(screen.getByLabelText(/content description/i), { 
        target: { value: 'Learn React fundamentals' } 
      });
      fireEvent.change(screen.getByLabelText(/target audience/i), { 
        target: { value: 'Web developers' } 
      });
      
      // Select options
      fireEvent.click(screen.getByText('Video'));
      fireEvent.click(screen.getByText('Tech'));
      fireEvent.click(screen.getByText('YouTube'));
      fireEvent.click(screen.getByText('15 Days'));
      
      // Submit form
      const createButton = screen.getByText(/create project/i);
      fireEvent.click(createButton);
      
      // Verify API calls were made
      await waitFor(() => {
        expect(mockApiResponses.createProject).toHaveBeenCalled();
      });
    });

    it('should validate all required fields before submission', async () => {
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Try to submit without filling required fields
      const createButton = screen.getByText(/create project/i);
      fireEvent.click(createButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/please select at least one content type/i)).toBeInTheDocument();
        expect(screen.getByText(/please select at least one content category/i)).toBeInTheDocument();
        expect(screen.getByText(/please select at least one channel type/i)).toBeInTheDocument();
        expect(screen.getByText(/content name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/content description is required/i)).toBeInTheDocument();
        expect(screen.getByText(/target audience is required/i)).toBeInTheDocument();
      });
      
      // Project creation should not be called
      expect(mockApiResponses.createProject).not.toHaveBeenCalled();
    });

    it('should handle form validation for multi-select fields', async () => {
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Fill in text fields
      fireEvent.change(screen.getByLabelText(/project name/i), { 
        target: { value: 'Test Project' } 
      });
      fireEvent.change(screen.getByLabelText(/content name/i), { 
        target: { value: 'Test Content' } 
      });
      fireEvent.change(screen.getByLabelText(/content description/i), { 
        target: { value: 'Test description' } 
      });
      fireEvent.change(screen.getByLabelText(/target audience/i), { 
        target: { value: 'Test audience' } 
      });
      
      // Submit without selecting multi-select options
      const createButton = screen.getByText(/create project/i);
      fireEvent.click(createButton);
      
      // Should show validation errors for multi-select fields
      await waitFor(() => {
        expect(screen.getByText(/please select at least one content type/i)).toBeInTheDocument();
        expect(screen.getByText(/please select at least one content category/i)).toBeInTheDocument();
        expect(screen.getByText(/please select at least one channel type/i)).toBeInTheDocument();
      });
    });

    it('should handle AI suggestion generation and selection', async () => {
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Fill in fields that trigger AI suggestions
      fireEvent.change(screen.getByLabelText(/project name/i), { 
        target: { value: 'Fitness Journey' } 
      });
      fireEvent.change(screen.getByLabelText(/content name/i), { 
        target: { value: 'Workout Tips' } 
      });
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByText('Instagram'));
      
      // Wait for AI suggestions
      await waitFor(() => {
        expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument();
        expect(screen.getByText('Fitness enthusiasts aged 18-35')).toBeInTheDocument();
      });
      
      // Select a suggestion
      const suggestion = screen.getByText('Fitness enthusiasts aged 18-35');
      fireEvent.click(suggestion);
      
      // Check if target audience is updated
      const targetAudienceInput = screen.getByLabelText(/target audience/i) as HTMLInputElement;
      expect(targetAudienceInput.value).toBe('Fitness enthusiasts aged 18-35');
    });

    it('should handle custom duration with date selection', async () => {
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Select custom duration
      fireEvent.click(screen.getByText('Custom'));
      
      // Should show custom date inputs
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      
      // Fill in custom dates
      const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
      
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-14' } });
      
      // Should validate custom dates
      expect(startDateInput.value).toBe('2024-01-01');
      expect(endDateInput.value).toBe('2024-01-14');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API to return error
      mockApiResponses.createProject.mockRejectedValueOnce(new Error('API Error'));
      
      render(<CreateProjectForm onProjectCreate={mockOnProjectCreate} onCancel={mockOnCancel} />);
      
      // Fill in valid data
      fireEvent.change(screen.getByLabelText(/project name/i), { 
        target: { value: 'Test Project' } 
      });
      fireEvent.change(screen.getByLabelText(/content name/i), { 
        target: { value: 'Test Content' } 
      });
      fireEvent.change(screen.getByLabelText(/content description/i), { 
        target: { value: 'Test description' } 
      });
      fireEvent.change(screen.getByLabelText(/target audience/i), { 
        target: { value: 'Test audience' } 
      });
      fireEvent.click(screen.getByText('Post'));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByText('Instagram'));
      
      // Submit form
      const createButton = screen.getByText(/create project/i);
      fireEvent.click(createButton);
      
      // Should handle error gracefully (form should not crash)
      await waitFor(() => {
        expect(screen.getByText(/create project/i)).toBeInTheDocument();
      });
    });
  });
});
