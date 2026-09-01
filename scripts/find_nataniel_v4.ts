// @ts-ignore
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

import { firestoreService } from "../src/lib/firestoreService";
async function run() {
  const colabs = await firestoreService.colaboradores.get();
  console.log("Found", colabs.length, "collaborators");
  const nataniel = colabs.find(
    (c: any) => c.nome && c.nome.includes("Nataniel"),
  );
  if (nataniel) {
    console.log("Found Nataniel:", nataniel.id, nataniel.nome);
  } else {
    console.log("Nataniel not found");
  }
}
run();
