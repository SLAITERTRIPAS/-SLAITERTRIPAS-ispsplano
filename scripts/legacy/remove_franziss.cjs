const fs = require("fs");
let code = fs.readFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  "utf8",
);

// Replace using regex
code = code.replace(
  /\/\/ Lógica "Um Só Franziss":[\s\S]*?\/\/ Remove duplicados do Franziss\n      \}/g,
  "      // Admin is hidden from the general list\n      if (isSystemAdmin) return false;",
);

fs.writeFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  code,
);
