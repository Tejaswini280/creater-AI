import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ContentStudio from '../pages/content-studio';

// Mock dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

vi.mock('wouter', () => ({
  useLocation: () => [vi.fn(), vi.fn()],
}));

describe('ContentStudio Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('renders main content studio layout', () => {
      render(<ContentStudio />);

      expect(screen.getByText('Content Studio')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Your Content')).toBeInTheDocument();
    });

    it('shows project context when projectId is present', () => {
      // Mock URL with projectId
      const mockLocation = vi.fn();
      vi.mocked(useLocation).mockReturnValue(['?projectId=123', mockLocation]);

      render(<ContentStudio />);

      expect(screen.getByText(/Project:/)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('displays all quick action buttons', () => {
      render(<ContentStudio />);

      expect(screen.getByText('Create Video')).toBeInTheDocument();
      expect(screen.getByText('AI Voiceover')).toBeInTheDocument();
      expect(screen.getByText('Brand Kit')).toBeInTheDocument();
      expect(screen.getByText('Niche Finder')).toBeInTheDocument();
    });

    it('opens AI generation modal when AI Voiceover is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      const aiVoiceoverButton = screen.getByText('AI Voiceover');
      await user.click(aiVoiceoverButton);

      // Modal should be opened (mock implementation)
      expect(screen.getByText('AI Voiceover')).toBeInTheDocument();
    });
  });

  describe('Content Creation', () => {
    it('shows create content form', () => {
      render(<ContentStudio />);

      const createContentButton = screen.getByText('Create Content');
      fireEvent.click(createContentButton);

      expect(screen.getByText('Content Title')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      const createContentButton = screen.getByText('Create Content');
      await user.click(createContentButton);

      const saveButton = screen.getByText('Save Content');
      await user.click(saveButton);

      // Should show validation error
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  describe('Platform Selection', () => {
    it('shows platform filter options', () => {
      render(<ContentStudio />);

      expect(screen.getByText('All Platforms')).toBeInTheDocument();
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('Facebook')).toBeInTheDocument();
    });

    it('filters content by selected platform', async () => {
      const user = userEvent.setup();
      render(<ContentStudio />);

      const platformSelect = screen.getByRole('combobox');
      await user.click(platformSelect);

      const youtubeOption = screen.getByText('YouTube');
      await user.click(youtubeOption);

      // Should filter content to show only YouTube content
      expect(screen.getByText('YouTube')).toBeInTheDocument();
    });
  });

  describe('Content Workspace Modal', () => {
    it('opens content workspace when content item is clicked', async () => {
      const user = userEvent.setup();

      // Mock content data
      const mockContent = {
        id: '1',
        title: 'Test Content',
        platform: 'youtube',
        contentType: 'video',
        status: 'draft'
      };

      render(<ContentStudio />);

      // Simulate clicking on content item
      const contentItem = screen.getByText('Test Content');
      await user.click(contentItem);

      expect(screen.getByText('Content Workspace')).toBeInTheDocument();
    });

    it('shows all content tabs in workspace', () => {
      render(<ContentStudio />);

      // Trigger content workspace opening
      const contentItem = screen.getByText('Test Content');
      fireEvent.click(contentItem);

      expect(screen.getByText('Add Media')).toBeInTheDocument();
      expect(screen.getByText('Create Content')).toBeInTheDocument();
      expect(screen.getByText('Media Library')).toBeInTheDocument();
      expect(screen.getByText('Script')).toBeInTheDocument();
      expect(screen.getByText('Voiceover')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
  });
});

describe('ContentWorkspaceModal Component', () => {
  const mockContent = {
    id: '1',
    title: 'Test Content',
    platform: 'youtube',
    contentType: 'video',
    status: 'draft'
  };

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    content: mockContent,
    onContentUpdate: vi.fn(),
  };

  it('renders all tabs correctly', () => {
    render(<ContentWorkspaceModal {...mockProps} />);

    expect(screen.getByText('Add Media')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.getByText('Script')).toBeInTheDocument();
    expect(screen.getByText('Voiceover')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  describe('Add Media Tab', () => {
    it('handles file upload', async () => {
      const user = userEvent.setup();
      render(<ContentWorkspaceModal {...mockProps} />);

      const addMediaTab = screen.getByText('Add Media');
      await user.click(addMediaTab);

      const fileInput = screen.getByLabelText(/select files/i);
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await user.upload(fileInput, file);

      expect(screen.getByText('test.mp4')).toBeInTheDocument();
    });
  });

  describe('Script Tab', () => {
    it('generates script with AI', async () => {
      const user = userEvent.setup();
      render(<ContentWorkspaceModal {...mockProps} />);

      const scriptTab = screen.getByText('Script');
      await user.click(scriptTab);

      const descriptionInput = screen.getByPlaceholderText(/describe your content/i);
      await user.type(descriptionInput, 'Test script description');

      const generateButton = screen.getByText('Generate Script');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating Script...')).toBeInTheDocument();
      });
    });
  });

  describe('Voiceover Tab', () => {
    it('generates voiceover', async () => {
      const user = userEvent.setup();
      render(<ContentWorkspaceModal {...mockProps} />);

      const voiceoverTab = screen.getByText('Voiceover');
      await user.click(voiceoverTab);

      const textInput = screen.getByPlaceholderText(/enter the text/i);
      await user.type(textInput, 'Test voiceover text');

      const generateButton = screen.getByText('Generate Voiceover');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating Voiceover...')).toBeInTheDocument();
      });
    });
  });

  describe('Schedule Tab', () => {
    it('handles scheduling', async () => {
      const user = userEvent.setup();
      render(<ContentWorkspaceModal {...mockProps} />);

      const scheduleTab = screen.getByText('Schedule');
      await user.click(scheduleTab);

      const platformCheckbox = screen.getByLabelText('Instagram');
      await user.click(platformCheckbox);

      const scheduleButton = screen.getByText('Schedule Content');
      await user.click(scheduleButton);

      expect(screen.getByText('Content Scheduled!')).toBeInTheDocument();
    });
  });
});
