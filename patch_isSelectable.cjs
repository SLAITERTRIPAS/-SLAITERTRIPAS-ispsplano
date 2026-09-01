const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

content = content.replace(
  /const isSelectable = formData\.trimestres\?\.includes\(trimForMonth\);/,
  'const isSelectable = formData.frequencia === "Pontual" || formData.trimestres?.includes(trimForMonth);',
);

fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched isSelectable.");
