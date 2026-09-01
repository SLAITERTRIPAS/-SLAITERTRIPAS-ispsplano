const fs = require('fs');
const file = 'src/blocos/bloco6_documentos/InformacaoPropostaForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `<span className="font-bold text-slate-900">1. Secretaria geral</span>`;
const replaceStr = `<span className="font-bold text-blue-900">1. Secretaria geral</span>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Target string not found");
}
