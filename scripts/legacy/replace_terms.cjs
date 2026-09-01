const fs = require("fs");
const path = require("path");

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir("src", function (filePath) {
  if (
    filePath.endsWith(".ts") ||
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".js") ||
    filePath.endsWith(".jsx")
  ) {
    let content = fs.readFileSync(filePath, "utf8");
    let originalContent = content;

    // Replace "Órgãos de Direção e Gestão" with "Órgão de Direção e Gestão"
    content = content.replace(
      /Órgãos de Direção e Gestão/g,
      "Órgão de Direção e Gestão",
    );

    // Replace exact matches of 'Órgãos' or "Órgãos"
    content = content.replace(/'Órgãos'/g, "'Unidade orgânica'");
    content = content.replace(/"Órgãos"/g, '"Unidade orgânica"');
    content = content.replace(/>Órgãos</g, ">Unidade orgânica<");

    // Other matches from the grep
    // src/blocos/bloco1_apresentacao/SubMenu.tsx:91:  const isUnidadesOrganicas = titleUpper.includes('ÓRGÃOS');
    content = content.replace(
      /includes\('ÓRGÃOS'\)/g,
      "includes('UNIDADE ORGÂNICA')",
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log("Updated", filePath);
    }
  }
});
