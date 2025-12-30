/**
 * PWA Icon Generator
 *
 * Generates PNG icons from the SVG favicon for PWA support.
 * Run with: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FAVICON_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

const ICON_SIZES = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('Generating PWA icons from favicon.svg...\n');

  // Check if favicon exists
  if (!fs.existsSync(FAVICON_PATH)) {
    console.error('Error: favicon.svg not found in public directory');
    process.exit(1);
  }

  // Read the SVG file
  const svgBuffer = fs.readFileSync(FAVICON_PATH);

  for (const icon of ICON_SIZES) {
    const outputPath = path.join(PUBLIC_DIR, icon.name);

    try {
      await sharp(svgBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 253, g: 250, b: 246, alpha: 1 } // #FDFAF6 - cream background
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}: ${error.message}`);
    }
  }

  console.log('\nPWA icons generated successfully!');
}

generateIcons().catch(console.error);
