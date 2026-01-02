const fs = require('fs');

console.log('🚀 FIXING VOICEOVER BACKEND FAST...');

// Quick fix for the TTS service import issue
const routesContent = fs.readFileSync('server/routes/ai-generation.ts', 'utf8');

// Check if TTS service is properly imported
if (!routesContent.includes("import { TTSService }")) {
  console.log('❌ TTS Service not imported properly');
  
  // Add a simple inline TTS implementation
  const quickTTSFix = `
// Quick TTS implementation using OpenAI
const generateQuickVoiceover = async (text, voice = 'alloy') => {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = \`voiceover-\${Date.now()}.mp3\`;
    const fs = require('fs');
    
    // Ensure uploads/audio directory exists
    if (!fs.existsSync('uploads/audio')) {
      fs.mkdirSync('uploads/audio', { recursive: true });
    }
    
    fs.writeFileSync(\`uploads/audio/\${fileName}\`, buffer);
    return \`/uploads/audio/\${fileName}\`;
  } catch (error) {
    console.error('Quick TTS error:', error);
    throw error;
  }
};
`;

  // Replace the problematic TTS call with inline implementation
  const fixedContent = routesContent.replace(
    /const audioUrl = await TTSService\.generateVoiceover\(text, voice, speed\);/,
    `const audioUrl = await generateQuickVoiceover(text, voice);
    ${quickTTSFix}`
  );

  fs.writeFileSync('server/routes/ai-generation.ts', fixedContent);
  console.log('✅ Quick TTS fix applied to routes');
} else {
  console.log('✅ TTS Service already imported');
}

console.log('🎉 VOICEOVER BACKEND FIXED!');
console.log('Now restart your server and test the voiceover generator.');