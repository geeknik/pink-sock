/**
 * SVG to PNG Converter Script
 * 
 * This script converts SVG files to PNG files at multiple resolutions
 * Usage: node convert_icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// SVG files to convert
const svgFiles = [
  { 
    input: path.join(__dirname, 'icon.svg'),
    output: 'icon',
  },
  { 
    input: path.join(__dirname, 'icon-disabled.svg'),
    output: 'icon-disabled',
  }
];

// Sizes to generate
const sizes = [16, 48, 128];

// Convert SVG to PNG at specified sizes
async function convertSvgToPng(svgPath, outputBaseName) {
  try {
    const svgData = fs.readFileSync(svgPath, 'utf8');
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`;
    
    // Convert to each size
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Load the SVG image
      const image = await loadImage(svgDataUrl);
      
      // Draw the image on the canvas
      ctx.drawImage(image, 0, 0, size, size);
      
      // Save as PNG
      const outputPath = path.join(__dirname, `${outputBaseName}${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Converted ${svgPath} to ${outputPath}`);
    }
  } catch (error) {
    console.error(`Error converting ${svgPath}:`, error);
  }
}

// Process each SVG file
async function processAllFiles() {
  for (const file of svgFiles) {
    await convertSvgToPng(file.input, file.output);
  }
}

// Run the conversion
processAllFiles().then(() => {
  console.log('All conversions completed');
}).catch(err => {
  console.error('Conversion failed:', err);
});
