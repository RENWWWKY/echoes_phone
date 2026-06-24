const fs = require('fs');
let c = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/App.jsx', 'utf8');

// 1. Add Feedback import
c = c.replace(
  'import WorldBook from "./components/WorldBook";\r\nimport MusicApp from "./components/Music";',
  'import WorldBook from "./components/WorldBook";\r\nimport Feedback from "./components/Feedback";\r\nimport MusicApp from "./components/Music";'
);

// 2. Add Feedback AppWindow before WorldBook section
c = c.replace(
  '{/* APP: WORLDBOOK (Grouped) */}\r\n          <WorldBook',
  '{/* APP: FEEDBACK */}\r\n          <AppWindow\r\n            isOpen={activeApp === "feedback"}\r\n            title="反馈"\r\n            onClose={() => setActiveApp(null)}\r\n          >\r\n            <Feedback onClose={() => setActiveApp(null)} />\r\n          </AppWindow>\r\n\r\n          {/* APP: WORLDBOOK (Grouped) */}\r\n          <WorldBook'
);

// 3. Fix APP_LIST: move feedback to last position
const appHelpersRaw = fs.readFileSync('C:/Users/bichenxi/echoes_phone/src/utils/appHelpers.jsx', 'utf8');
// Remove feedback from current position (after APP_LIST = [)
let appHelpers = appHelpersRaw.replace('\r\n  { id: "feedback", label: "反馈", icon: MessageSquare },\r\n', '\r\n');
// Add feedback as last item before ];
appHelpers = appHelpers.replace(
  '  { id: "settings", label: "系统设置", icon: SlidersHorizontal },\r\n];',
  '  { id: "settings", label: "系统设置", icon: SlidersHorizontal },\r\n  { id: "feedback", label: "反馈", icon: MessageSquare },\r\n];'
);

fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/App.jsx', c, 'utf8');
fs.writeFileSync('C:/Users/bichenxi/echoes_phone/src/utils/appHelpers.jsx', appHelpers, 'utf8');

console.log('Import added:', c.includes('import Feedback'));
console.log('AppWindow added:', c.includes('APP: FEEDBACK'));
console.log('APP_LIST last is feedback:', appHelpers.includes('"feedback"'));
