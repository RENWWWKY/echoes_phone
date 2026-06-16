const fs = require('fs');
let code = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/App.jsx', 'utf8');
// Find the precise position where the corrupted newline is
const idx = code.indexOf('                    \\n      {/*');
if (idx > -1) {
  code = code.substring(0, idx) + code.substring(idx + '                    \\n'.length);
  fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/App.jsx', code, 'utf8');
  console.log('Fixed');
} else {
  console.log('Not found');
}
