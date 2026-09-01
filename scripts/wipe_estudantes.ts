import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../src/lib/firebase";

async function wipeCollection(collectionName: string) {
  console.log(`Wiping collection: ${collectionName}`);
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  
  let count = 0;
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, document.id));
    count++;
  }
  console.log(`Deleted ${count} documents from ${collectionName}`);
}

async function run() {
  try {
    await wipeCollection("atendimentos_estudantis");
    await wipeCollection("efetivo_escolar");
    console.log("Wipe completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Wipe failed:", error);
    process.exit(1);
  }
}

run();
