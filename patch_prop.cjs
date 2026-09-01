const fs = require("fs");

function patch(file) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("<FormLayout")) {
    content = content.replace(
      /<FormLayout/,
      "<FormLayout hidePrintHeader={true}",
    );
    fs.writeFileSync(file, content);
    console.log("Patched " + file);
  }
}

patch("src/blocos/bloco6_documentos/InformacaoPropostaForm.tsx");
patch("src/blocos/bloco6_documentos/GuiaApresentacaoInterna.tsx");
patch("src/blocos/bloco6_documentos/GuiaTransferenciaBens.tsx");
patch("src/blocos/bloco6_documentos/OrdemServicoTransferencia.tsx");
