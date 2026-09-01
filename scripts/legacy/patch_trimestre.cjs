const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

content = content.replace(
  /if \(\!formData\.trimestre\) \{ setError\('Selecione o trimestre'\); return false; \}/,
  `if (!formData.trimestres || formData.trimestres.length === 0) { setError('Selecione pelo menos um trimestre'); return false; }`,
);

content = content.replace(
  /\{formData\.trimestre \? \`\$\{formData\.trimestre\}\` : 'Nenhum trimestre selecionado'\}/g,
  `{formData.trimestres && formData.trimestres.length > 0 ? formData.trimestres.join(', ') : 'Nenhum trimestre selecionado'}`,
);

fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched trimestre.");
