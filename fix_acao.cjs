const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

code = code.replace(/                \)}\n                \)}/g, '                )}');

fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
console.log("Fixed AcaoOrcamentalView");

let viewRenderer = fs.readFileSync('src/components/ViewRenderer.tsx', 'utf8');
let lines = viewRenderer.split('\\n');
// we can fix it more carefully
