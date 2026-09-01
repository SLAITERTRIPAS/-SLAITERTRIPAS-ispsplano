const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

const regex1 = /if \(isAjudaCustoMotorista\) \{[\s\S]*?if \(isCombustivel\)/;
const replacement1 = `if (isAjudaCustoMotorista) {
          const precoUnitario = 6000;
          const qtd = rubrica.quantidade || 0;
          const dias = prev.totalDias || 0;
          
          const valorTotal = dias * (0.3 * precoUnitario * qtd);
          if (rubrica.precoUnitario !== precoUnitario || rubrica.valorTotal !== valorTotal) {
            hasChanges = true;
            return { ...rubrica, precoUnitario, valorTotal };
          }
        }
        if (isCombustivel)`;

content = content.replace(regex1, replacement1);

const regex2 =
  /const isMotorista = rubrica\.necessidade\?\.toLowerCase\(\)\.includes\('motorista'\);\s*let valorTotal = 0;\s*if \(isMotorista\) \{[\s\S]*?\} else \{/;
const replacement2 = `const isMotorista = rubrica.necessidade?.toLowerCase().includes('motorista');
                              let valorTotal = 0;
                              if (isMotorista) {
                                valorTotal = dias * (0.3 * valorDiario * qtd);
                              } else {`;

content = content.replace(regex2, replacement2);

fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched 1 and 2.");
