import { EFETIVO_GERAL_DATA } from "./src/constants/colaboradoresList";
import fs from "fs";
fs.writeFileSync(
  "./temp_colaboradores.json",
  JSON.stringify(EFETIVO_GERAL_DATA, null, 2),
);
