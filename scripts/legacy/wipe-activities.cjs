const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const collectionsToClear = [
  "matrix_activities",
  "actividades",
  "plano_actividades",
  "plan_schedules",
  "calendar_events"
];

async function clearCollection(name) {
  try {
    const colRef = collection(db, name);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log(`${name} is already empty.`);
      return 0;
    }
    
    console.log(`Cleaning ${name}: ${snapshot.size} docs`);
    
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = snapshot.docs.slice(i, i + 500);
      chunk.forEach(d => batch.delete(doc(db, name, d.id)));
      await batch.commit();
    }
    return snapshot.size;
  } catch (e) {
    console.error(`Error cleaning ${name}: ${e.message}`);
    return 0;
  }
}

async function run() {
  console.log("Starting Activities Wipe...");
  for (const col of collectionsToClear) {
    await clearCollection(col);
  }
  console.log("Activities Wipe Finished.");
}

run();
