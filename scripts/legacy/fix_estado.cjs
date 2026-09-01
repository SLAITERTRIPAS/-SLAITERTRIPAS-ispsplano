const fs = require("fs");
let code = fs.readFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  "utf8",
);

// Insert isColaboradorInactive helper before statsMetrics
const helper = `
  const isColaboradorInactive = (estado?: string) => {
    if (!estado) return false;
    const e = estado.trim().toLowerCase();
    return ['falecido', 'transferido', 'reformado', 'inativo', 'aposentado', 'licença', 'licenca', 'eliminado'].includes(e);
  };
`;
code = code.replace(
  "  const statsMetrics = {",
  helper + "\n  const statsMetrics = {",
);

// Replace the old condition in statsMetrics
code = code.replace(
  /!\(c\.estado && c\.estado !== 'Ativo' && c\.estado !== 'Em Acção' && c\.estado !== 'Nenhum'\)/g,
  "!isColaboradorInactive(c.estado)",
);

// Replace foraISPS calculation
code = code.replace(
  "foraISPS: colaboradores.filter(\n      (c) => c.estado && (c.estado !== 'Ativo' && c.estado !== 'Em Acção' && c.estado !== 'Nenhum')\n    ).length,",
  "foraISPS: colaboradores.filter((c) => isColaboradorInactive(c.estado)).length,",
);

// Replace filteredList !filtro condition
code = code.replace(
  "if (!filtro) return matchesSearch;",
  "if (!filtro) return matchesSearch && !isColaboradorInactive(c.estado);",
);

// Replace matchesForaISPS condition
code = code.replace(
  "const matchesForaISPS = filtro.foraISPS ? (c.estado && c.estado !== 'Ativo' && c.estado !== 'Em Acção' && c.estado !== 'Nenhum') : true;",
  "const matchesForaISPS = filtro.foraISPS ? isColaboradorInactive(c.estado) : !isColaboradorInactive(c.estado);",
);

fs.writeFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  code,
);
