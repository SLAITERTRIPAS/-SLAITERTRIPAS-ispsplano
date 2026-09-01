const fs = require("fs");
const file = "src/lib/firestoreService.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /const chefiaColaboradores = colaboradores\.filter\([\s\S]*?\);\s*if \(chefiaColaboradores\.length === 0\) \{[\s\S]*?\}\s*let createdCount = 0;\s*let updatedCount = 0;\s*for \(const col of chefiaColaboradores\) \{/,
  `const targetColaboradores = colaboradores;
      
      if (targetColaboradores.length === 0) {
        return { created: 0, updated: 0, message: "Não foram encontrados colaboradores." };
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const col of targetColaboradores) {`,
);

fs.writeFileSync(file, content);
console.log("Patched firestoreService.ts");
