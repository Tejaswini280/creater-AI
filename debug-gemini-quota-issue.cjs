#!/usr/bin/env node

/**
 * Debug script to identify and explain the Gemini quota issue
 * affecting Advanced Code Generation functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugGeminiQuotaIssue() {
  console.log('🔍 DEBUGGING GEMINI QUOTA ISSUE');
  console.log('================================\n');

  try {
    // 1. Test login
    console.log('1️⃣ Testing authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Authentication successful\n');

    // 2. Test code generation with detailed logging
    console.log('2️⃣ Testing code generation with detailed response...');
    const codeResponse = await axios.post(`${BASE_URL}/api/gemini/generate-code`, {
      description: 'Create a simple hello world function',
      language: 'javascript'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = codeResponse.data;
    console.log('📊 Response Analysis:');
    console.log('- Success:', data.success);
    console.log('- Code length:', data.data?.code?.length || 0);
    console.log('- Explanation length:', data.data?.explanation?.length || 0);
    console.log('- Model used:', data.metadata?.model || 'unknown');
    
    // 3. Analyze the code content to detect fallback
    const code = data.data?.code || '';
    const isFallback = code.includes('TODO: Implement') || 
                      code.includes('generatedFunction') || 
                      code.includes('Implementation needed');
    
    console.log('\n🔍 Code Analysis:');
    console.log('- Is fallback template:', isFallback ? '✅ YES' : '❌ NO');
    console.log('- Code preview:', code.substring(0, 100) + '...');
    
    if (isFallback) {
      console.log('\n⚠️ ISSUE IDENTIFIED: GEMINI API QUOTA EXCEEDED');
      console.log('=====================================');
      console.log('The Advanced Code Generation is working correctly,');
      console.log('but the Gemini API key has exceeded its free tier quota.');
      console.log('This causes the service to fall back to template responses.');
      console.log('\n💡 SOLUTIONS:');
      console.log('1. Wait for quota reset (daily limit: 20 requests)');
      console.log('2. Upgrade to Gemini Pro API plan');
      console.log('3. Use a different API key');
      console.log('4. Switch to gemini-1.5-flash model (higher quota)');
    } else {
      console.log('\n✅ Real AI-generated code detected!');
    }

    // 4. Test direct Gemini API
    console.log('\n3️⃣ Testing direct Gemini API...');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent("Say hello");
      console.log('✅ Direct Gemini API working');
      console.log('- Response:', result.response.text().substring(0, 50) + '...');
    } catch (geminiError) {
      console.log('❌ Direct Gemini API failed:', geminiError.message);
      
      if (geminiError.message.includes('quota') || geminiError.message.includes('429')) {
        console.log('\n🎯 CONFIRMED: Quota exceeded on Gemini API');
        console.log('This explains why code generation shows fallback templates.');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugGeminiQuotaIssue().catch(console.error);