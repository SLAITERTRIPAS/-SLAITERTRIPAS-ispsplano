import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const colRef = collection(db, "colaboradores");
  const snapshot = await getDocs(colRef);
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.nome && data.nome.includes("Nataniel")) {
      console.log(doc.id, data.nome);
    }
  });
}
run();
