const fs = require('fs');

// Read the file
let content = fs.readFileSync('server/storage.ts', 'utf8');

// Find the second occurrence of getAnalyticsPerformance method
const lines = content.split('\n');
let firstMethodEnd = -1;
let secondMethodStart = -1;
let secondMethodEnd = -1;

// Find the first method end (around line 942)
for (let i = 940; i < 950; i++) {
  if (lines[i] && lines[i].includes('}')) {
    firstMethodEnd = i;
    break;
  }
}

// Find the second method start (around line 1293)
for (let i = 1290; i < 1300; i++) {
  if (lines[i] && lines[i].includes('async getAnalyticsPerformance')) {
    secondMethodStart = i;
    break;
  }
}

// Find the second method end (around line 1459)
for (let i = 1455; i < 1465; i++) {
  if (lines[i] && lines[i].includes('}') && lines[i+1] && lines[i+1].includes('// Get Social Account by ID')) {
    secondMethodEnd = i;
    break;
  }
}

console.log('First method end:', firstMethodEnd);
console.log('Second method start:', secondMethodStart);
console.log('Second method end:', secondMethodEnd);

if (secondMethodStart > 0 && secondMethodEnd > 0) {
  // Remove the duplicate method (lines secondMethodStart to secondMethodEnd)
  const newLines = lines.slice(0, secondMethodStart - 1).concat(lines.slice(secondMethodEnd + 1));
  fs.writeFileSync('server/storage.ts', newLines.join('\n'));
  console.log('Duplicate method removed successfully');
} else {
  console.log('Could not find duplicate method boundaries');
}
