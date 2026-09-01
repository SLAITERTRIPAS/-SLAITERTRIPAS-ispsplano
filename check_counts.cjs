const admin = require("firebase-admin");
const serviceAccount = require("./export_dados_firestore.json");

// Using service account to access if app environment doesn't allow admin
// Actually just use the app's db from the container if possible?
// The environment should have firebase configured.
// Trying a simple admin.initializeApp() assuming standard environment.

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function checkCollections() {
  const collections = [
    "colaboradores",
    "estudantes",
    "calendar_events",
    "expedientes",
    "actividades",
    "service_requests",
    "reports",
    "matrix_activities",
    "requisicoes_internas",
  ];

  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    console.log(`Collection ${col} has ${snapshot.size} documents.`);
  }
}

checkCollections().catch(console.error);
