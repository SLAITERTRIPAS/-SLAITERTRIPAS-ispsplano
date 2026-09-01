const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/PlanoWorkflowView.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/activeSubTab === "plano_reparticao"\n\s*\? "setorial"\n\s*: selectedRoleMode\.toLowerCase\(\)/g,
  `activeSubTab === "plano_reparticao"\n                    ? "reparticao"\n                    : selectedRoleMode === "Repartição"\n                      ? "reparticao"\n                      : selectedRoleMode.toLowerCase()`);
                      
code = code.replace(/activeSubTab === "plano_reparticao"\n\s*\? "setorial"\n\s*: "setorial"/g,
  `activeSubTab === "plano_reparticao"\n              ? "reparticao"\n              : selectedRoleMode === "Repartição"\n                ? "reparticao"\n                : "setorial"`);

fs.writeFileSync(file, code);
