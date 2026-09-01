const fs = require('fs');
let code = fs.readFileSync('src/blocos/bloco9_produtos_precos/GestaoProdutosPrecosView.tsx', 'utf8');

const target = `              const necessidadesList = getNecessidadesOptions(rubricaName);
              const rubricaProducts = filteredProducts.filter(
                (p) => (p.rubrica || "").trim().toLowerCase() === rubricaName.trim().toLowerCase()
              );
              if (rubricaProducts.length === 0 && filterRubrica !== "TODAS") return null;`;

const replacement = `              const necessidadesList = getNecessidadesOptions(rubricaName);
              
              let filteredNecessidadesList = necessidadesList;
              if (filterNecessidade !== "TODAS") {
                filteredNecessidadesList = necessidadesList.filter((necName) => {
                  const formattedNec = formatNecessidadeWithCode(necName, rubricaName);
                  return (
                    necName.trim().toLowerCase() === filterNecessidade.trim().toLowerCase() ||
                    formattedNec.trim().toLowerCase() === filterNecessidade.trim().toLowerCase()
                  );
                });
              }

              const rubricaProducts = filteredProducts.filter(
                (p) => (p.rubrica || "").trim().toLowerCase() === rubricaName.trim().toLowerCase()
              );

              if (filteredNecessidadesList.length === 0) return null;
              if (rubricaProducts.length === 0 && filterRubrica !== "TODAS") return null;`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/blocos/bloco9_produtos_precos/GestaoProdutosPrecosView.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found. Target length:", target.length);
  // let's try a regex
  code = code.replace(/const necessidadesList = getNecessidadesOptions\(rubricaName\);[\s\S]*?if \(rubricaProducts\.length === 0 && filterRubrica !== "TODAS"\) return null;/, replacement);
  fs.writeFileSync('src/blocos/bloco9_produtos_precos/GestaoProdutosPrecosView.tsx', code);
  console.log("Fallback regex applied");
}
