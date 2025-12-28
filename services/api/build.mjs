import * as esbuild from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Get all TypeScript files recursively, excluding tests
function getEntryPoints(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip test directories
      if (item === '__tests__' || item === 'node_modules') continue;
      getEntryPoints(fullPath, files);
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const entryPoints = getEntryPoints('src');

console.log(`Building ${entryPoints.length} files...`);

await esbuild.build({
  entryPoints,
  outdir: 'dist',
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  bundle: false,
  // Don't bundle - we want to keep the file structure
  packages: 'external',
});

console.log('Build complete!');
