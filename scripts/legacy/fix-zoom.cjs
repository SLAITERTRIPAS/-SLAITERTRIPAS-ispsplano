const fs = require('fs');
let code = fs.readFileSync('src/lib/printUtils.ts', 'utf8');
code = code.replace(/zoom: 0\.65;/g, '');
code = code.replace(/print-color-adjust: exact !important;/g, 'print-color-adjust: exact !important;\n            zoom: 0.65;');
fs.writeFileSync('src/lib/printUtils.ts', code);
