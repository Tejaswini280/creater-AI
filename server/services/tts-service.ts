import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class TTSService {
  private static audioDir = path.join(process.cwd(), 'uploads', 'audio');

  static async ensureAudioDir() {
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  static async generateVoiceover(text: string, voice: string = 'alloy', speed: number = 1.0): Promise<string> {
    try {
      await this.ensureAudioDir();

      console.log(`🎙️ Generating voiceover with OpenAI TTS...`);
      console.log(`📝 Text: ${text.substring(0, 100)}...`);
      console.log(`🗣️ Voice: ${voice}`);
      console.log(`⚡ Speed: ${speed}`);

      const response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: voice as any,
        input: text,
        speed: speed
      });

      const audioId = nanoid();
      const fileName = `voiceover-${audioId}.mp3`;
      const filePath = path.join(this.audioDir, fileName);

      // Save audio file
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      console.log(`✅ Voiceover generated: ${fileName}`);
      
      // Return relative URL for frontend
      return `/uploads/audio/${fileName}`;
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }

  static async generateMultipleVoices(text: string, voices: string[] = ['alloy', 'echo', 'nova']): Promise<Array<{voice: string, audioUrl: string}>> {
    const results = [];
    
    for (const voice of voices) {
      try {
        const audioUrl = await this.generateVoiceover(text, voice);
        results.push({ voice, audioUrl });
      } catch (error) {
        console.error(`Failed to generate voice ${voice}:`, error);
        // Continue with other voices
      }
    }
    
    return results;
  }
}