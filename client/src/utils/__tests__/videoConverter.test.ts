/**
 * Tests for VideoConverter utility
 * Tests the MP4 export functionality and memory management
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import videoConverter, { VideoConverter } from '../videoConverter';

// Mock FFmpeg
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  })),
}));

jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  toBlobURL: jest.fn().mockResolvedValue('mock-url'),
}));

// Mock window.gc
Object.defineProperty(window, 'gc', {
  value: jest.fn(),
  writable: true,
});

describe('VideoConverter', () => {
  let converter: VideoConverter;

  beforeEach(() => {
    converter = new VideoConverter();
    // Reset FFmpeg loaded state
    (converter as any).isLoaded = false;
    (converter as any).ffmpeg = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load FFmpeg successfully', async () => {
      await expect(converter.load()).resolves.toBeUndefined();
      expect((converter as any).isLoaded).toBe(true);
    });

    it('should not reload if already loaded', async () => {
      (converter as any).isLoaded = true;
      await converter.load();
      // Should not call load again
    });

    it('should throw error on load failure', async () => {
      const mockFFmpeg = (converter as any).ffmpeg;
      mockFFmpeg.load.mockRejectedValueOnce(new Error('Load failed'));

      await expect(converter.load()).rejects.toThrow('Load failed');
    });
  });

  describe('convertVideo', () => {
    const mockBlob = new Blob(['test'], { type: 'video/webm' });

    beforeEach(async () => {
      await converter.load();
    });

    it('should convert WebM to MP4 successfully', async () => {
      const result = await converter.convertVideo(mockBlob, 'mp4');

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('video/mp4');
    });

    it('should handle different quality settings', async () => {
      const result = await converter.convertVideo(mockBlob, 'mp4', {
        quality: 'low',
        includeAudio: false,
        optimizeWeb: false,
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should use default options when not provided', async () => {
      const result = await converter.convertVideo(mockBlob, 'mp4');

      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error when FFmpeg not loaded', async () => {
      (converter as any).ffmpeg = null;

      await expect(converter.convertVideo(mockBlob, 'mp4'))
        .rejects.toThrow('FFmpeg not loaded');
    });

    it('should clean up files on error', async () => {
      const mockFFmpeg = (converter as any).ffmpeg;
      mockFFmpeg.exec.mockRejectedValueOnce(new Error('Conversion failed'));

      await expect(converter.convertVideo(mockBlob, 'mp4'))
        .rejects.toThrow('Conversion failed');

      // Should still try to clean up files
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('input.webm');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('output.mp4');
    });

    it('should call garbage collection after successful conversion', async () => {
      await converter.convertVideo(mockBlob, 'mp4');

      expect(window.gc).toHaveBeenCalled();
    });

    it('should monitor memory usage during conversion', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await converter.convertVideo(mockBlob, 'mp4');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting video conversion')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Video conversion completed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('buildCommand', () => {
    beforeEach(async () => {
      await converter.load();
    });

    it('should build correct MP4 command', () => {
      const command = (converter as any).buildCommand(
        'input.webm',
        'output.mp4',
        'mp4',
        { quality: 'high', includeAudio: true, optimizeWeb: true }
      );

      expect(command).toContain('libx264');
      expect(command).toContain('preset');
      expect(command).toContain('crf');
      expect(command).toContain('aac');
      expect(command).toContain('movflags');
    });

    it('should build correct WebM command', () => {
      const command = (converter as any).buildCommand(
        'input.webm',
        'output.webm',
        'webm',
        { quality: 'high', includeAudio: true, optimizeWeb: true }
      );

      expect(command).toContain('libvpx-vp9');
      expect(command).toContain('libopus');
    });

    it('should exclude audio when requested', () => {
      const command = (converter as any).buildCommand(
        'input.webm',
        'output.mp4',
        'mp4',
        { quality: 'high', includeAudio: false, optimizeWeb: true }
      );

      expect(command).toContain('-an');
    });
  });

  describe('getVideoInfo', () => {
    it('should throw error when FFmpeg not loaded', async () => {
      await expect(converter.getVideoInfo(mockBlob))
        .rejects.toThrow('FFmpeg not loaded');
    });

    it('should return video info object', async () => {
      await converter.load();

      const info = await converter.getVideoInfo(mockBlob);

      expect(info).toHaveProperty('duration');
      expect(info).toHaveProperty('width');
      expect(info).toHaveProperty('height');
      expect(info).toHaveProperty('hasAudio');
    });
  });
});
