import fs from "fs";
import path from "path";

// Carregar o conteúdo do arquivo
const filePath = "./src/constants/colaboradoresList.ts";
const content = fs.readFileSync(filePath, "utf-8");

// Extrair os dados do array usando uma Regex ou parse básico
// Como o arquivo exporta um array de objetos JSON, podemos isolar o array
const arrayMatch = content.match(
  /export const EFETIVO_GERAL_DATA: Colaborador\[] = (\[[\s\S]*\]);/,
);
if (!arrayMatch) {
  console.error("Não foi possível encontrar EFETIVO_GERAL_DATA");
  process.exit(1);
}

// Para avaliar de forma limpa, vamos escrever um arquivo temporário em JS/JSON para o ler
const arrayString = arrayMatch[1];
const tempFile = "./temp_colaboradores.json";

// Limpar um pouco a string para ser JSON válido (remover aspas de chaves etc, mas no colaboradoresList já parece ser formato objeto JSON ou JS válido)
// Para ser seguro, criamos um mini script que importa e imprime como JSON
const runnerScript = `
import { EFETIVO_GERAL_DATA } from './src/constants/colaboradoresList';
import fs from 'fs';
fs.writeFileSync('${tempFile}', JSON.stringify(EFETIVO_GERAL_DATA, null, 2));
`;

fs.writeFileSync("./temp_runner.ts", runnerScript);
console.log("Runner temporário criado.");
