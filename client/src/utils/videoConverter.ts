// @ts-ignore - FFmpeg types not available
import { FFmpeg } from '@ffmpeg/ffmpeg';
// @ts-ignore - FFmpeg util types not available
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class VideoConverter {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  async load() {
    if (this.isLoaded) return;

    try {
      this.ffmpeg = new FFmpeg();
      this.ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log('FFmpeg:', message);
      });

      await this.ffmpeg.load({
        coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
      });

      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw error;
    }
  }

  async convertVideo(
    inputBlob: Blob,
    outputFormat: string,
    options: {
      quality?: 'high' | 'medium' | 'low';
      includeAudio?: boolean;
      optimizeWeb?: boolean;
      cropParams?: string;
      trimParams?: string;
    } = {}
  ): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    const {
      quality = 'high',
      includeAudio = true,
      optimizeWeb = true,
      cropParams,
      trimParams,
    } = options;

    const inputFileName = 'input.webm';
    const outputFileName = `output.${outputFormat}`;

    try {
      // Monitor memory before conversion
      const memoryBefore = (window.performance as any).memory;
      console.log('🎬 Starting video conversion. Memory before:', {
        used: memoryBefore ? (memoryBefore.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A',
        inputSize: (inputBlob.size / 1024 / 1024).toFixed(2) + 'MB'
      });

      // Write input file
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(inputBlob));

      // Build FFmpeg command based on format and options
      const command = this.buildCommand(inputFileName, outputFileName, outputFormat, {
        quality,
        includeAudio,
        optimizeWeb,
      });

      // Run conversion with progress monitoring
      console.log('⚙️ Running FFmpeg command:', command.join(' '));
      await this.ffmpeg.exec(command);

      // Read output file
      const outputData = await this.ffmpeg.readFile(outputFileName);
      const outputBlob = new Blob([outputData], { type: `video/${outputFormat}` });

      // Monitor memory after conversion
      const memoryAfter = (window.performance as any).memory;
      console.log('✅ Video conversion completed. Memory after:', {
        used: memoryAfter ? (memoryAfter.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A',
        outputSize: (outputBlob.size / 1024 / 1024).toFixed(2) + 'MB'
      });

      // Clean up files immediately
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      // Force garbage collection hint
      if (window.gc) {
        window.gc();
      }

      return outputBlob;
    } catch (error) {
      console.error('Video conversion failed:', error);

      // Clean up files even on error
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
      } catch (cleanupError) {
        console.warn('Failed to clean up files after error:', cleanupError);
      }

      throw error;
    }
  }

  private buildCommand(
    input: string,
    output: string,
    format: string,
    options: {
      quality: 'high' | 'medium' | 'low';
      includeAudio: boolean;
      optimizeWeb: boolean;
      cropParams?: string;
      trimParams?: string;
    }
  ): string[] {
    const { quality, includeAudio, optimizeWeb, cropParams, trimParams } = options;
    const command = ['-i', input];

    // Add filter complex for crop and trim
    const filters: string[] = [];
    if (cropParams) {
      filters.push(cropParams);
    }
    if (trimParams) {
      filters.push(trimParams);
    }

    if (filters.length > 0) {
      command.push('-filter:v', filters.join(','));
    }

    // Quality settings
    switch (quality) {
      case 'high':
        if (format === 'mp4') {
          command.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18');
        } else if (format === 'webm') {
          command.push('-c:v', 'libvpx-vp9', '-crf', '20', '-b:v', '0');
        }
        break;
      case 'medium':
        if (format === 'mp4') {
          command.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
        } else if (format === 'webm') {
          command.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0');
        }
        break;
      case 'low':
        if (format === 'mp4') {
          command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '28');
        } else if (format === 'webm') {
          command.push('-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0');
        }
        break;
    }

    // Audio settings
    if (includeAudio) {
      if (format === 'mp4') {
        command.push('-c:a', 'aac', '-b:a', '128k');
      } else if (format === 'webm') {
        command.push('-c:a', 'libopus', '-b:a', '128k');
      }
    } else {
      command.push('-an'); // No audio
    }

    // Web optimization
    if (optimizeWeb && format === 'mp4') {
      command.push('-movflags', '+faststart');
    }

    command.push(output);
    return command;
  }

  async getVideoInfo(blob: Blob): Promise<{
    duration: number;
    width: number;
    height: number;
    hasAudio: boolean;
  }> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    const inputFileName = 'info.webm';

    try {
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(blob));

      // Get duration and basic info
      await this.ffmpeg.exec(['-i', inputFileName, '-f', 'null', '-']);

      // For more detailed info, we'd need to parse the output
      // For now, return basic placeholder info
      return {
        duration: 0, // Would need to parse from FFmpeg output
        width: 1920, // Would need to parse from FFmpeg output
        height: 1080, // Would need to parse from FFmpeg output
        hasAudio: true, // Would need to parse from FFmpeg output
      };
    } catch (error) {
      console.error('Failed to get video info:', error);
      throw error;
    } finally {
      try {
        await this.ffmpeg?.deleteFile(inputFileName);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

export const videoConverter = new VideoConverter();
export default videoConverter;
