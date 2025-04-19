/**
 * Basic PNG Generator
 * 
 * This script creates simple colored PNG files in the required sizes
 * as placeholders until the SVG conversion can be run.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Sizes to generate
const sizes = [16, 48, 128];

// Generate a simple colored PNG
function generateColoredPng(size, color, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw filled circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = '#D6568F';
  ctx.lineWidth = size / 25;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw a simple sock shape
  ctx.fillStyle = '#D6568F';
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.3);
  ctx.lineTo(size * 0.3, size * 0.7);
  ctx.lineTo(size * 0.7, size * 0.7);
  ctx.lineTo(size * 0.7, size * 0.3);
  ctx.closePath();
  ctx.fill();
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Generated ${outputPath}`);
}

// Generate all icon sizes
function generateAllIcons() {
  // Create directory if it doesn't exist
  const iconsDir = path.join(__dirname);
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Generate regular icons
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    generateColoredPng(size, '#FF69B4', outputPath);
  }
  
  // Generate disabled icons
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-disabled${size}.png`);
    generateColoredPng(size, '#CCCCCC', outputPath);
  }
}

// Run the generation
generateAllIcons();
console.log('All icons created');
