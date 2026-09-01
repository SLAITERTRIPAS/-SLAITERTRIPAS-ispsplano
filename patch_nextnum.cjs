const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/ActivityForm.tsx';
let code = fs.readFileSync(file, 'utf-8');

const regex = /function calculateNextNum\(acts: any\[\], currentDept\?: string\): number \{[\s\S]*?return maxNum \+ 1;\n\}/;

const replacement = `function calculateNextNum(acts: any[], currentUserArea?: string): number {
  let maxNum = 0;
  if (acts && Array.isArray(acts)) {
    acts.forEach((act: any) => {
      if (currentUserArea) {
        const actDir = String(act.direcao || "").trim().toLowerCase();
        const actDept = String(act.departamento || act.unidadeOrganica || "").trim().toLowerCase();
        const actRep = String(act.reparticao || "").trim().toLowerCase();
        const actSetor = String(act.setor || act.sector || "").trim().toLowerCase();
        const combinedActArea = \`\${actDir} \${actDept} \${actRep} \${actSetor}\`;
        
        const curArea = String(currentUserArea).trim().toLowerCase();
        if (!combinedActArea.includes(curArea)) {
          return; // Skip this activity as it does not belong to the user's area
        }
      }
      const numStr = act.numeroAtividade || act.nAtividade || act.no;
      if (numStr) {
        const parsed = parseInt(String(numStr).replace(/\\D/g, ""), 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });
  }
  return maxNum + 1;
}`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
