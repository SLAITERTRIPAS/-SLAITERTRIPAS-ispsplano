const fs = require('fs');
let code = fs.readFileSync('src/lib/firestoreService.ts', 'utf8');

code = code.replace(
  'const match = act.referencia.match(/(.*?)-(\\d+)$/);',
  'const match = String(act.referencia || "").match(/(.*?)-(\\d+)$/);'
);

fs.writeFileSync('src/lib/firestoreService.ts', code);
console.log("Patched match 2");
