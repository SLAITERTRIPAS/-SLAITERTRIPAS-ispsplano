const fs = require("fs");
let code = fs.readFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  "utf8",
);

// Remove c.nuit === '108164611' everywhere else where it's used for isSystemAdmin
code = code.replace(/ \|\|[\n\s]+c\.nuit === '108164611'/g, "");
code = code.replace(/ \|\|[\n\s]+existingCol\.nuit === '108164611'/g, "");

fs.writeFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  code,
);
