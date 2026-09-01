import fs from "fs";

const data = JSON.parse(fs.readFileSync("./temp_colaboradores.json", "utf-8"));

console.log(`Total de colaboradores carregados: ${data.length}`);

// Procurar Franzíssi Tripalonga Vicente
const franzissis = data.filter(
  (c) => c.nome && c.nome.toLowerCase().includes("franzí"),
);
console.log(
  `\nOcorrências de Franzíssi Tripalonga Vicente: ${franzissis.length}`,
);
franzissis.forEach((f, idx) => {
  console.log(
    `[${idx + 1}] ID: ${f.id}, NUIT: ${f.nuit}, BI: ${f.numeroBI}, Email: ${f.email}, Efetivo: ${f.efetivo}, Unidade: ${f.unidade}, Cargo: ${f.cargo}`,
  );
  console.log(
    `    Nível Acadêmico: ${f.nivelAcademico}, Formação: ${f.areaFormacao}`,
  );
  console.log(`    Carreira: ${f.carreira}, Vínculo: ${f.vinculoContractual}`);
});

// Analisar duplicados
// Vamos agrupar por nome simplificado (em minúsculas, sem espaços extras)
const groups = {};
data.forEach((c) => {
  if (!c.nome) return;
  const nameKey = c.nome.trim().toLowerCase();
  if (!groups[nameKey]) groups[nameKey] = [];
  groups[nameKey].push(c);
});

console.log(`\n--- COLABORADORES DUPLICADOS DETETADOS ---`);
let duplicateCount = 0;
const duplicatesList = [];

for (const name in groups) {
  if (groups[name].length > 1) {
    duplicateCount++;
    console.log(
      `\nNome: "${groups[name][0].nome}" (${groups[name].length} ocorrências)`,
    );
    groups[name].forEach((c, i) => {
      // Contar campos preenchidos para ver qual é o mais completo
      let filledFields = 0;
      for (const k in c) {
        if (
          c[k] !== undefined &&
          c[k] !== null &&
          c[k] !== "" &&
          c[k] !== "---"
        ) {
          filledFields++;
        }
      }
      console.log(
        `  [${i + 1}] ID: ${c.id}, Ord: ${c.ord}, NUIT: ${c.nuit}, BI: ${c.numeroBI}, Campos Preenchidos: ${filledFields}/${Object.keys(c).length}`,
      );
    });
    duplicatesList.push({
      name: groups[name][0].nome,
      items: groups[name],
    });
  }
}

console.log(`\nTotal de nomes com duplicados: ${duplicateCount}`);
fs.writeFileSync(
  "./duplicates_report.json",
  JSON.stringify(duplicatesList, null, 2),
);
