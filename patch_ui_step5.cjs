const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

// Update checkboxes display
content = content.replace(
  /<span className="text-xs font-bold">\{t\}<\/span>/,
  '<span className="text-xs font-bold">{t} de {nextYear}</span>',
);

// Update info text
content = content.replace(
  /\{formData\.trimestres && formData\.trimestres\.length > 0 \? formData\.trimestres\.join\(\', \'\) : \'Nenhum trimestre selecionado\'\}/,
  "{formData.trimestres && formData.trimestres.length > 0 ? formData.trimestres.map(t => `${t} de ${nextYear}`).join(', ') : 'Nenhum trimestre selecionado'}",
);

fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched UI step 5.");
