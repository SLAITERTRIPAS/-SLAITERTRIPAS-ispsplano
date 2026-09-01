import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(
  fs.readFileSync("./firebase-applet-config.json", "utf8"),
);
// Map firestoreDatabaseId
const config = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const app = initializeApp(config);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const colRef = collection(db, "matrix_activities");
  const snap = await getDocs(colRef);
  console.log(`--- Total de Atividades no Firestore: ${snap.size} ---`);

  if (snap.size > 0) {
    const docs = snap.docs.slice(0, 10).map((d) => ({ id: d.id, ...d.data() }));
    console.log(JSON.stringify(docs, null, 2));
  }
}

run().catch(console.error);
