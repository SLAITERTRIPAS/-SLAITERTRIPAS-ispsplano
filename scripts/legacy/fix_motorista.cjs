const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

const regex =
  /if \(isMotorista\) \{\s*valorTotal = dias \* \(0\.3 \* valorDiario \* qtd\);\s*\} else \{\s*valorTotal = \(qtd \* dias \* valorDiario\) \+ \(0\.3 \* valorDiario \* qtd\);\s*\}\s*\} else \{/;

const replacement = `if (isMotorista) {
                                valorTotal = dias * (0.3 * valorDiario * qtd);
                              } else {`;

content = content.replace(regex, replacement);
fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
