import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function clearCollection(collName: string) {
  console.log(`Buscando documentos na coleção '${collName}'...`);
  const colRef = collection(db, collName);
  const snapshot = await getDocs(colRef);
  console.log(`Encontrados ${snapshot.size} documentos em '${collName}'. Excluindo...`);
  
  let deletedCount = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collName, docSnap.id));
    deletedCount++;
  }
  console.log(`Limpeza concluída para '${collName}': ${deletedCount} documentos excluídos.`);
}

async function run() {
  const collectionsToClear = [
    "matrix_activities",
    "actividades",
    "plano_actividades",
    "plano_trabalho_anual",
    "institucional_plans",
    "drafts"
  ];

  try {
    for (const c of collectionsToClear) {
      await clearCollection(c);
    }
    console.log("✅ Todos os planos de atividades foram completamente removidos da base de dados Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao limpar planos de atividade:", error);
    process.exit(1);
  }
}

run();
