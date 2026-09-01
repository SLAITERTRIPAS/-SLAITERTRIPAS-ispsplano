const fs = require('fs');
const file = 'src/blocos/bloco6_documentos/InformacaoPropostaForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const tableStartString = '            {/* Tabela de Custos */}';
const tableEndString = '          </div>\n\n          {/* Rodapé Oficial da Primeira Página */}';

const tableStartIndex = content.indexOf(tableStartString);
const tableEndIndex = content.indexOf(tableEndString);

if (tableStartIndex !== -1 && tableEndIndex !== -1) {
  const tableChunk = content.substring(tableStartIndex, tableEndIndex);
  
  // Remove tableChunk from original content
  content = content.replace(tableChunk, '');
  
  // Insert tableChunk after "Pág. 2 </span> </div>"
  const insertAfterString = '              <span className="text-[10px] text-slate-400 font-serif font-bold">\n                Pág. 2\n              </span>\n            </div>\n';
  const insertIndex = content.indexOf(insertAfterString);
  
  if (insertIndex !== -1) {
    content = content.substring(0, insertIndex + insertAfterString.length) + '\n' + tableChunk + content.substring(insertIndex + insertAfterString.length);
    fs.writeFileSync(file, content);
    console.log("Success");
  } else {
    console.log("Could not find insert index");
  }
} else {
  console.log("Could not find table start or end index");
}
