const fs = require("fs");
let content = fs.readFileSync("src/lib/utils.ts", "utf8");

// Replace the GDG abbreviation
content = content.replace(
  /if \(d\.includes\("diretor-geral"\) \|\| d\.includes\("diretor geral"\)\) return "GDG";\n/,
  "",
);

// Add ODG abbreviation
content = content.replace(
  /if \(d\.includes\("dicosafa"\) \|\| d\.includes\("finanças e de apoio"\)\) return "DICOSAFA";/,
  `if (d.includes("órgãos de direção e gestão") || d.includes("orgaos de direcao e gestao")) return "ÓDG";\n  if (d.includes("dicosafa") || d.includes("finanças e de apoio")) return "DICOSAFA";`,
);

fs.writeFileSync("src/lib/utils.ts", content);
console.log("Patched utils.");
