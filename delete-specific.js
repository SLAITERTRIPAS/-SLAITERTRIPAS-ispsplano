import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const actsSnap = await getDocs(collection(db, "matrix_activities"));
  const activities = actsSnap.docs.map((d) => ({ docId: d.id, ...d.data() }));

  const target = activities.find(
    (a) =>
      a.title &&
      a.title.includes("Defesas de Relatórios de Estágio Profissional") &&
      a.status === "setorial" &&
      a.departamento === "Departamento de Engenharia de Construção Civil",
  );

  if (target) {
    console.log("Found and deleting:", target.docId);
    await deleteDoc(doc(db, "matrix_activities", target.docId));
  } else {
    console.log("Not found.");
  }
}
run()
  .catch(console.error)
  .then(() => process.exit(0));
