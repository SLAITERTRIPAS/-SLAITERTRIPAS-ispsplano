const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf8');

const regex = /\/\/ Fallback genérico de correspondência exata para a área do utilizador[\s\S]*?return false;\n\};/g;

const replacement = `// Fallback genérico de correspondência exata para a área do utilizador
  // We match the most specific level the user belongs to, preventing them from seeing broader areas
  if (uSector && tSector) {
    if (tSector === uSector || tSector.includes(uSector) || uSector.includes(tSector)) return true;
  } else if (uDept && tDept) {
    if (tDept === uDept || tDept.includes(uDept) || uDept.includes(tDept)) return true;
  } else if (uDir && tDir) {
    if (tDir === uDir || tDir.includes(uDir) || uDir.includes(tDir)) return true;
  }

  // If activity is at department level (no sector) and user is in a sector of that department
  if (uSector && uDept && !tSector && tDept) {
     if (tDept === uDept || tDept.includes(uDept) || uDept.includes(tDept)) return true;
  }

  return false;
};`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/auth.ts', code);
