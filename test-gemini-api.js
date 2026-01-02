import { GoogleGenerativeAI } from '@google/generative-ai';

// Test the new API key
const GEMINI_API_KEY = "your_gemini_api_key_here";

async function testGeminiAPI() {
  try {
    console.log('🧪 Testing Gemini API with new key...');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });
    
    const prompt = "Generate a short 10-second video script about AI content creation";
    
    console.log('📝 Sending test prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('✅ Gemini API test successful!');
    console.log('📄 Response:', response);
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('🔑 API key is invalid or expired');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error('💰 API quota exceeded');
    } else if (error.message.includes('MODEL_NOT_FOUND')) {
      console.error('🤖 Model not found - check model name');
    }
  }
}

testGeminiAPI();
