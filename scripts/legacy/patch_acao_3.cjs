const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

if (!code.includes('getSetoresByDepartamento')) {
  console.log("Not found, weird.");
} else if (!code.includes('import { getSetoresByDepartamento')) {
  code = code.replace(
    'import { UNIDADES_ORGANICAS_SISTEMA, DEPARTAMENTOS } from "../constants/formOptions";',
    'import { UNIDADES_ORGANICAS_SISTEMA, DEPARTAMENTOS, getSetoresByDepartamento } from "../constants/formOptions";'
  );
  fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
  console.log("Import added");
}
