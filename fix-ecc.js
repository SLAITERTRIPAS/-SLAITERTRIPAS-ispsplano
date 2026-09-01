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
  const activities = actsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const eccActs = activities.filter((a) => {
    const dept = String(a.departamento || "").toLowerCase();
    const rep = String(a.reparticao || "").toLowerCase();
    const setor = String(a.setor || "").toLowerCase();

    return (
      dept.includes("ecc") ||
      rep.includes("ecc") ||
      setor.includes("ecc") ||
      dept.includes("civil") ||
      rep.includes("civil") ||
      setor.includes("civil")
    );
  });

  const grouped = {};
  for (const act of eccActs) {
    const title = (act.title || act.designacao || act.atividade || "")
      .toLowerCase()
      .trim();
    const year = act.ano || 2026;
    const key = title + "::" + year;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(act);
  }

  let delCount = 0;
  for (const key in grouped) {
    console.log(`Duplicate found: ${key} (Count: ${grouped[key].length})`);
    if (grouped[key].length > 1) {
      // Sort to prefer the one with the more formal department name, or keep the first one
      grouped[key].sort((a, b) => {
        if (a.departamento === "Departamento de Engenharia de Construção Civil")
          return -1;
        if (b.departamento === "Departamento de Engenharia de Construção Civil")
          return 1;
        return 0;
      });

      for (let i = 1; i < grouped[key].length; i++) {
        console.log(
          "Deleting:",
          grouped[key][i].id,
          grouped[key][i].departamento,
        );
        await deleteDoc(doc(db, "matrix_activities", grouped[key][i].id));
        delCount++;
      }
    }
  }
  console.log("Deleted", delCount, "duplicate ECC activities.");
}
run()
  .catch(console.error)
  .then(() => process.exit(0));
