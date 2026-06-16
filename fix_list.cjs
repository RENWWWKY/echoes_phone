const fs = require('fs');
let c = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/utils/appHelpers.jsx', 'utf8');
const old = '\r\n  { id: "forum", label: "生活圈", icon: Hash },\r\n';
const nw = '\r\n  { id: "feedback", label: "反馈", icon: MessageSquare },\r\n  { id: "forum", label: "生活圈", icon: Hash },\r\n';
const idx = c.indexOf(old);
console.log('idx:', idx);
c = c.substring(0, idx) + nw + c.substring(idx + old.length);
fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/utils/appHelpers.jsx', c, 'utf8');
console.log('OK, contains feedback:', c.includes('feedback'));
