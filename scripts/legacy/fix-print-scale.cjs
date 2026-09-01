const fs = require('fs');
let code = fs.readFileSync('src/lib/printUtils.ts', 'utf8');

code = code.replace(
  'print-color-adjust: exact !important;',
  'print-color-adjust: exact !important;\n            transform: scale(0.75);\n            transform-origin: top left;\n            width: 133% !important;'
);

fs.writeFileSync('src/lib/printUtils.ts', code);
