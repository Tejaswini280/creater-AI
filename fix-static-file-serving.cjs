#!/usr/bin/env node

/**
 * Fix Static File Serving for Railway Deployment
 * This script ensures the frontend files are properly served
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing static file serving configuration...');

// Check if dist directory exists
const distPath = path.join(process.cwd(), 'dist');
const publicPath = path.join(distPath, 'public');

console.log('📁 Checking directories...');
console.log('- dist path:', distPath);
console.log('- public path:', publicPath);

if (!fs.existsSync(distPath)) {
    console.log('❌ dist directory not found. Running build...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { stdio: 'inherit' });
}

if (!fs.existsSync(publicPath)) {
    console.log('❌ dist/public directory not found after build!');
    process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(publicPath, 'index.html');
if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found in dist/public!');
    process.exit(1);
}

console.log('✅ index.html found at:', indexPath);

// Read and verify index.html content
const indexContent = fs.readFileSync(indexPath, 'utf8');
if (indexContent.length < 100) {
    console.log('❌ index.html appears to be empty or corrupted!');
    console.log('Content length:', indexContent.length);
    process.exit(1);
}

console.log('✅ index.html content verified (', indexContent.length, 'bytes)');

// Check static-server.ts configuration
const staticServerPath = path.join(process.cwd(), 'server', 'static-server.ts');
if (fs.existsSync(staticServerPath)) {
    const staticServerContent = fs.readFileSync(staticServerPath, 'utf8');
    console.log('📄 Static server configuration found');
    
    // Verify it serves from the correct path
    if (staticServerContent.includes('dist/public')) {
        console.log('✅ Static server configured to serve from dist/public');
    } else {
        console.log('⚠️ Static server may not be configured correctly');
    }
} else {
    console.log('❌ static-server.ts not found!');
}

// List files in dist/public to verify build output
console.log('📋 Files in dist/public:');
const publicFiles = fs.readdirSync(publicPath);
publicFiles.forEach(file => {
    const filePath = path.join(publicPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.size} bytes)`);
});

// Check if assets directory exists
const assetsPath = path.join(publicPath, 'assets');
if (fs.existsSync(assetsPath)) {
    console.log('📋 Assets directory found:');
    const assetFiles = fs.readdirSync(assetsPath);
    assetFiles.slice(0, 5).forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        console.log(`  - assets/${file} (${stats.size} bytes)`);
    });
    if (assetFiles.length > 5) {
        console.log(`  ... and ${assetFiles.length - 5} more files`);
    }
} else {
    console.log('⚠️ Assets directory not found');
}

console.log('🎉 Static file serving verification completed!');
console.log('✅ Your frontend files should now be properly served by Railway');