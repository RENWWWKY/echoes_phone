const fs = require('fs');
let c = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/components/Personalization.jsx', 'utf8');

// The button blocks to add for each skin
// Simply insert new rules right after the existing "按钮选中态白字" block (or add entire block for neon)

// For skins with existing button block: find "/* 按钮选中态白字 */" then the closing } before `,
// and insert the * rules after the button rules

// Use run method: find the exact position of the LAST line before the closing backtick of each btn block
// The btn block always ends with: }\r\n` (where ` is the template literal end)

// Find all "按钮选中态白字" positions
// Then find the closing backtick that comes after each one
// Insert the additional rules right before that backtick

let replacements = 0;

// For each skin, find its unique anchor BEFORE the button block, then modify
// freebreeze: anchor = .bg-gray-300 { background: #d1e5dc !important; }
// latte: anchor = .bg-gray-300 { background: #e8d5c0 !important; }  
// pixel: anchor = .bg-gray-300 { background: #ffcce0 !important; }
// midnight: anchor = .bg-gray-300 { background: #3a3a6a !important; }
// sweet: anchor = .bg-gray-300 { background: #e0d0d8 !important; }

const patches = [
  { gray: '#d1e5dc', color: '#fff', hover: '#fff' },
  { gray: '#e8d5c0', color: '#fff', hover: '#fff' },
  { gray: '#ffcce0', color: '#00e5ff', hover: '#33ebff' },
  { gray: '#3a3a6a', color: '#fff', hover: '#fff' },
  { gray: '#e0d0d8', color: '#fff', hover: '#fff' },
];

for (const p of patches) {
  // Find anchor: .bg-gray-300 { background: GRAY !important; }\r\n/* 按钮选中态白字 */\r\n
  const anchor = `.bg-gray-300 { background: ${p.gray} !important; }\r\n/* 按钮选中态白字 */\r\n`;
  const idx = c.indexOf(anchor);
  if (idx === -1) { console.log(`${p.gray}: NOT FOUND`); continue; }
  
  // Find where this button block ends: it's before the closing `,\r\n  }
  const afterAnchor = c.substring(idx + anchor.length);
  
  // The CSS template literal ends with ` followed by ,\r\n  } (end of object)
  // Find \r\n` (backtick that closes the CSS)
  const closingIdx = afterAnchor.indexOf('\r\n`');
  if (closingIdx === -1) { console.log(`${p.gray}: no closing backtick`); continue; }
  
  // Build the new button block content
  const newBtnBlock = 
    `#echoes-chat button.bg-black { color: ${p.color} !important; }\r\n` +
    `#echoes-chat button.bg-black:hover { color: ${p.hover} !important; }\r\n` +
    `#echoes-chat button.bg-black * { color: ${p.color} !important; }\r\n` +
    `#echoes-chat button.bg-black:hover * { color: ${p.hover} !important; }\r\n` +
    `#echoes-chat [class*="bg-black"][class*="text-white"] { color: #fff !important; }`;
  
  // Replace from anchor+comment to closing backtick with new block + closing backtick
  c = c.substring(0, idx + anchor.length) + newBtnBlock + afterAnchor.substring(closingIdx);
  replacements++;
  console.log(`${p.gray}: OK`);
}

// Handle neon: find its unique closing marker
// Neon CSS ends with:  [class*="rounded-tl-none"] * { color: #000000 !important; }\r\n`,\r\n  },\r\n  {\r\n    id: "pixel"
const neonMarker = '[class*="rounded-tl-none"] * { color: #000000 !important; }\r\n`,\r\n  },\r\n  {\r\n    id: "pixel"';
const neonIdx = c.indexOf(neonMarker);
if (neonIdx !== -1) {
  // Insert button rules before the closing backtick
  const neonNew = 
    '[class*="rounded-tl-none"] * { color: #000000 !important; }\r\n\r\n' +
    '/* 按钮选中态白字 */\r\n' +
    '#echoes-chat button.bg-black * { color: #050a0e !important; }\r\n' +
    '#echoes-chat button.bg-black:hover * { color: #000 !important; }\r\n\r\n' +
    '`,\r\n  },\r\n  {\r\n    id: "pixel"';
  c = c.substring(0, neonIdx) + neonNew + c.substring(neonIdx + neonMarker.length);
  console.log('neon: OK');
} else {
  console.log('neon: NOT FOUND');
}

fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/components/Personalization.jsx', c, 'utf8');
console.log('Total replacements:', replacements);
