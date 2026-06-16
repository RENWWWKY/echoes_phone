const fs = require('fs');
let c = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/components/Personalization.jsx', 'utf8');

const oldBlock = '/* 按钮选中态白字 */\r\n#echoes-chat button.bg-black { color: #fff !important; }\r\n#echoes-chat button.bg-black:hover { color: #fff !important; }\r\n#echoes-chat [class*="bg-black"][class*="text-white"] { color: #fff !important; }\r\n`,\r\n  }\r\n];';
const newBlock = '/* 按钮选中态白字 */\r\n#echoes-chat button.bg-black { color: #fff !important; }\r\n#echoes-chat button.bg-black:hover { color: #fff !important; }\r\n#echoes-chat button.bg-black * { color: #fff !important; }\r\n#echoes-chat button.bg-black:hover * { color: #fff !important; }\r\n#echoes-chat [class*="bg-black"][class*="text-white"] { color: #fff !important; }\r\n`,\r\n  }\r\n];';

c = c.replace(oldBlock, newBlock);
fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/components/Personalization.jsx', c, 'utf8');
console.log('Fixed skin 6');
