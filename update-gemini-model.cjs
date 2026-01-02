const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'server/services/openai.ts',
  'server/services/streaming-ai.ts',
  'shared/schema.ts',
  'server/services/ai-scheduling-service.ts',
  'server/services/content-management.ts',
  'server/services/gemini.ts',
  'server/services/ai-video-generation.ts',
  'server/services/ai-project-manager.ts',
  'server/examples/ai-project-examples.ts'
];

function updateGeminiModel() {
  console.log('🔄 Updating Gemini model references...');
  
  filesToUpdate.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace all instances of gemini-1.5-flash with gemini-2.5-flash
        const originalContent = content;
        content = content.replace(/gemini-1\.5-flash/g, 'gemini-2.5-flash');
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Updated ${filePath}`);
        } else {
          console.log(`⚪ No changes needed in ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  });
  
  console.log('\n🎉 Gemini model update complete!');
  console.log('All references updated from gemini-1.5-flash to gemini-2.5-flash');
}

updateGeminiModel();