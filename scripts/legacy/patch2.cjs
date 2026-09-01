const fs = require('fs');
let code = fs.readFileSync('src/blocos/bloco9_produtos_precos/GestaoProdutosPrecosView.tsx', 'utf8');

code = code.replace(
  /{necessidadesList\.map\(\(necName\) => {/g,
  "{filteredNecessidadesList.map((necName) => {"
);

fs.writeFileSync('src/blocos/bloco9_produtos_precos/GestaoProdutosPrecosView.tsx', code);
console.log("Replaced necessidadesList map");
