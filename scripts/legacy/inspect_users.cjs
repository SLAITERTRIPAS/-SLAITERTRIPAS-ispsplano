const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs = require("fs");

const config = JSON.parse(
  fs.readFileSync("firebase-applet-config.json", "utf8"),
);

// Standard Firebase v9+ JS SDK initialization
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  console.log("=== USERS IN FIRESTORE ===");
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach((doc) => {
    console.log(
      `ID: ${doc.id} | Email: ${doc.data().email} | Name: ${doc.data().name} | Role: ${doc.data().role} | NUIT: ${doc.data().nuit} | Usuario: ${doc.data().usuario}`,
    );
  });

  console.log("\n=== FRANZISSI COLABORADORES IN FIRESTORE ===");
  const colabsSnap = await getDocs(collection(db, "colaboradores"));
  colabsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.nome && data.nome.includes("Franzissi")) {
      console.log(
        `ID: ${doc.id} | Email: ${data.email} | Name: ${data.nome} | Cargo: ${data.cargo} | NUIT: ${data.nuit} | Usuario: ${data.usuario}`,
      );
    }
  });
}

run().catch(console.error);
