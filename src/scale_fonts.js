import fs from 'fs';

// 1. Read your massive, untouched game file
let code = fs.readFileSync('main.js', 'utf8');

// 2. The magic conversion map (Old Size -> New Chunky Size)
const sizeMap = {
  80: 48,
  48: 32,
  42: 28,
  32: 24,
  28: 20,
  24: 16,
  20: 12,
  18: 12,
  16: 10,
  14: 10,
  12: 8,
  11: 8,
  10: 6,
  8: 6
};

// 3. Find every instance of "size: X" and shrink it safely
code = code.replace(/size:\s*(\d+)/g, (match, number) => {
  const oldSize = parseInt(number, 10);
  const newSize = sizeMap[oldSize];
  
  // If it's a size we mapped, shrink it. Otherwise, leave it alone.
  if (newSize) {
    return `size: ${newSize}`;
  }
  return match; 
});

// 4. Save the updated file back
fs.writeFileSync('main.js', code);
console.log('✨ All text sizes successfully crunched for Press Start 2P!');