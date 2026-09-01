const admin = require("firebase-admin");
const serviceAccount = require("./export_dados_firestore.json"); // This might not be right, need to check how to init

// Actually, I can just use firebase-admin if it's installed and configured.
// Since it's a Node app, it should work.

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL:
    "https://ai-studio-remixremixsigepi-ff2e874d-e260-4688-a734-5b5cdc42df09.firebaseio.com", // This needs to be correct.
});

const db = admin.firestore();

async function listDocs(collectionName) {
  const snapshot = await db.collection(collectionName).limit(10).get();
  snapshot.forEach((doc) => {
    console.log(`${collectionName}: ${doc.id}`);
  });
}

async function run() {
  const collections = [
    "colaboradores",
    "estudantes",
    "calendar_events",
    "expedientes",
    "service_requests",
  ];
  for (const col of collections) {
    await listDocs(col);
  }
}

run().catch(console.error);
