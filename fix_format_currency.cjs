const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

if (!code.includes('import { formatCurrency')) {
  code = code.replace(
    'import { printElementById } from "../lib/printUtils";',
    'import { printElementById } from "../lib/printUtils";\nimport { formatCurrency } from "../lib/utils";'
  );
  fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
  console.log("Imported formatCurrency");
} else {
  console.log("Already imported");
}
