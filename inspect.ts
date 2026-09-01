
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "./src/lib/firebase";

async function inspectData() {
  const collections = ["matrix_activities", "actividades"];
  for (const colName of collections) {
    console.log(`Inspecting ${colName}:`);
    const q = query(collection(db, colName), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
    } else {
      console.log("Empty");
    }
  }
}
inspectData();
