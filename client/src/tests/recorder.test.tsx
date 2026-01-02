import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Recorder from '../pages/recorder';

// Mock the hooks and dependencies
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

vi.mock('wouter', () => ({
  useLocation: () => [vi.fn(), vi.fn()],
}));

// Mock MediaDevices API
const mockGetUserMedia = vi.fn();
const mockGetDisplayMedia = vi.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
    getDisplayMedia: mockGetDisplayMedia,
  },
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Recorder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Recording Options', () => {
    it('renders all recording option buttons', () => {
      render(<Recorder />);

      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Screen')).toBeInTheDocument();
      expect(screen.getByText('Screen & Camera')).toBeInTheDocument();
      expect(screen.getByText('Slides & Camera')).toBeInTheDocument();
      expect(screen.getByText('Slides')).toBeInTheDocument();
    });

    it('shows recording options grid on record tab', () => {
      render(<Recorder />);

      const recordTab = screen.getByRole('tab', { name: /record/i });
      fireEvent.click(recordTab);

      expect(screen.getByText('Choose Recording Type')).toBeInTheDocument();
    });
  });

  describe('Recording Functionality', () => {
    it('starts camera recording when camera option is selected', async () => {
      const mockStream = { getTracks: vi.fn(() => []) };
      mockGetUserMedia.mockResolvedValue(mockStream);

      render(<Recorder />);

      const cameraButton = screen.getByText('Camera');
      fireEvent.click(cameraButton);

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: expect.any(Object),
          audio: expect.any(Object),
        });
      });
    });

    it('starts screen recording when screen option is selected', async () => {
      const mockStream = { getTracks: vi.fn(() => []) };
      mockGetDisplayMedia.mockResolvedValue(mockStream);

      render(<Recorder />);

      const screenButton = screen.getByText('Screen');
      fireEvent.click(screenButton);

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockGetDisplayMedia).toHaveBeenCalledWith({
          video: expect.any(Object),
          audio: true,
        });
      });
    });

    it('handles recording errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      render(<Recorder />);

      const cameraButton = screen.getByText('Camera');
      fireEvent.click(cameraButton);

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Preview Section', () => {
    it('displays preview tab after recording is stopped', async () => {
      render(<Recorder />);

      // Simulate recording completion
      const recorder = new Recorder();
      recorder.simulateRecordingComplete();

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      expect(previewTab).toBeInTheDocument();
    });

    it('shows recording stats in preview', () => {
      render(<Recorder />);

      // Trigger preview with mock data
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      expect(screen.getByText(/Recording Preview/i)).toBeInTheDocument();
    });
  });

  describe('Editing Tools', () => {
    it('shows edit tab with video controls', () => {
      render(<Recorder />);

      const editTab = screen.getByRole('tab', { name: /edit/i });
      fireEvent.click(editTab);

      expect(screen.getByText('Video Preview')).toBeInTheDocument();
      expect(screen.getByText('Editing Tools')).toBeInTheDocument();
    });

    it('displays all editing tool buttons', () => {
      render(<Recorder />);

      const editTab = screen.getByRole('tab', { name: /edit/i });
      fireEvent.click(editTab);

      expect(screen.getByText('Trim')).toBeInTheDocument();
      expect(screen.getByText('Crop')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Effects')).toBeInTheDocument();
    });

    it('shows trim panel when trim tool is clicked', async () => {
      const user = userEvent.setup();
      render(<Recorder />);

      const editTab = screen.getByRole('tab', { name: /edit/i });
      fireEvent.click(editTab);

      const trimButton = screen.getByText('Trim');
      await user.click(trimButton);

      expect(screen.getByText('Trim Video')).toBeInTheDocument();
      expect(screen.getByText('Start Time')).toBeInTheDocument();
      expect(screen.getByText('End Time')).toBeInTheDocument();
    });
  });

  describe('Export Section', () => {
    it('shows export tab with quality settings', () => {
      render(<Recorder />);

      const exportTab = screen.getByRole('tab', { name: /export/i });
      fireEvent.click(exportTab);

      expect(screen.getByText('Export Your Recording')).toBeInTheDocument();
      expect(screen.getByText('Quality')).toBeInTheDocument();
    });

    it('includes all export options', () => {
      render(<Recorder />);

      const exportTab = screen.getByRole('tab', { name: /export/i });
      fireEvent.click(exportTab);

      expect(screen.getByText('File Format')).toBeInTheDocument();
      expect(screen.getByText('Export Settings')).toBeInTheDocument();
    });
  });

  describe('Library Section', () => {
    it('shows library tab with saved recordings', () => {
      render(<Recorder />);

      const libraryTab = screen.getByRole('tab', { name: /library/i });
      fireEvent.click(libraryTab);

      expect(screen.getByText('Saved Recordings')).toBeInTheDocument();
    });

    it('displays library statistics', () => {
      render(<Recorder />);

      const libraryTab = screen.getByRole('tab', { name: /library/i });
      fireEvent.click(libraryTab);

      expect(screen.getByText('Total Recordings')).toBeInTheDocument();
      expect(screen.getByText('Total Duration')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
    });
  });
});
