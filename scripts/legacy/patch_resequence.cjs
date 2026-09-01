const fs = require('fs');
let code = fs.readFileSync('src/lib/firestoreService.ts', 'utf8');

const target = `  const getNumericOrderVal = (act: any) => {
    const code = act.referencia || act.codigoActividade || "";
    const match = code.match(/(\\d+)$/);`;

const replacement = `  const getNumericOrderVal = (act: any) => {
    const code = String(act.referencia || act.codigoActividade || "");
    const match = code.match(/(\\d+)$/);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/lib/firestoreService.ts', code);
  console.log("Patched getNumericOrderVal");
} else {
  console.log("Not found target");
}
