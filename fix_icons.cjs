const fs = require('fs');
let c = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/components/Personalization.jsx', 'utf8');

// 1. 甜梦泡泡: add feedback icon using pink-toy.png (after the 浏览器刷新 block)
const pinkToyBlock = '/* 玩具替换浏览器刷新按钮图标 */\r\n#echoes-chat [data-app-link="浏览器刷新"] svg { display:none !important; }\r\n#echoes-chat [data-app-link="浏览器刷新"]::before { content:""; display:inline-block; width:16px; height:16px; background-image:url("./pink-toy.png"); background-size:contain; background-repeat:no-repeat; vertical-align:middle; margin-right:6px; }';
const pinkNew = pinkToyBlock + '\r\n/* 玩具替换反馈按钮图标 */\r\n#echoes-chat [data-app-link="反馈"] svg { display:none !important; }\r\n#echoes-chat [data-app-link="反馈"] .glass-panel::after { content:""; position:absolute; inset:6px; background-image:url("./pink-toy.png"); background-size:contain; background-repeat:no-repeat; background-position:center; }';
c = c.replace(pinkToyBlock, pinkNew);

// 2. 像素复古: change 个性化 from vapor-gameboy to vapor-ipod
c = c.replace(
  'background-image:url("./vapor-gameboy.png")',
  'background-image:url("./vapor-ipod.png")'
);

// 3. 像素复古: add feedback icon using vapor-shell.png (after the GameBoy/iPod section for 个性化)
const vaporPersonalBlock = '/* GameBoy替换个性化App图标 */\r\n#echoes-chat [data-app-link="个性化"] svg { display:none !important; }\r\n#echoes-chat [data-app-link="个性化"] .glass-panel::after { content:""; position:absolute; inset:6px; background-image:url("./vapor-ipod.png"); background-size:contain; background-repeat:no-repeat; background-position:center; filter: drop-shadow(2px 2px 0px #00e5ff); }';
// This block already has the change from step 2, now add feedback after it
c = c.replace(
  vaporPersonalBlock,
  vaporPersonalBlock + '\r\n/* Shell替换反馈App图标 */\r\n#echoes-chat [data-app-link="反馈"] svg { display:none !important; }\r\n#echoes-chat [data-app-link="反馈"] .glass-panel::after { content:""; position:absolute; inset:6px; background-image:url("./vapor-shell.png"); background-size:contain; background-repeat:no-repeat; background-position:center; filter: drop-shadow(2px 2px 0px #00e5ff); }'
);

fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/components/Personalization.jsx', c, 'utf8');
console.log('Done');
