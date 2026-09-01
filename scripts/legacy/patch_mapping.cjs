const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/PlanoWorkflowView.tsx",
  "utf8",
);

// The block to replace is in `onSubmit` of ActivityForm
content = content.replace(
  /direcao:\s*data\.selectedCategory \|\|\s*data\.direcao \|\|\s*editingActivity\?\.direcao \|\|\s*"",/g,
  `direcao: data.unidadeSelecionada || data.direcao || editingActivity?.direcao || "",`,
);

content = content.replace(
  /unidadeOrganica: data\.unidadeSelecionada \|\| "ISPS",/g,
  `unidadeOrganica: data.selectedCategory || data.unidadeOrganica || editingActivity?.unidadeOrganica || "ISPS",`,
);

fs.writeFileSync("src/blocos/bloco5_sistema/PlanoWorkflowView.tsx", content);
console.log("Patched mapping in PlanoWorkflowView.");
