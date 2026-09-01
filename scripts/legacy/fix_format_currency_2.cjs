const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

code = code.replace(
  'import { formatCurrency } from "../lib/utils";',
  'const formatCurrency = (val) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(val || 0);'
);

fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
console.log("Fixed formatCurrency");
