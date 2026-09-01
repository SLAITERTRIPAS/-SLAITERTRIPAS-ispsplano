const fs = require("fs");
let code = fs.readFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  "utf8",
);

code = code.replace(
  '        const confirmWord = window.prompt("Por favor, digite \'Eliminar Tudo\' para confirmar a limpeza total:");\n        if (confirmWord === "Eliminar Tudo") {\n          setIsProcessing(true);\n          try {',
  "          setIsProcessing(true);\n          try {",
);

code = code.replace(
  "            setIsProcessing(false);\n          }\n        }",
  "            setIsProcessing(false);\n          }",
);

fs.writeFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  code,
);
