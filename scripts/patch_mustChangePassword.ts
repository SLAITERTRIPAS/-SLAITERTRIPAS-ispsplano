import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize with default credentials
admin.initializeApp();

const db = getFirestore();

async function run() {
  const colRef = db.collection("colaboradores");
  const snapshot = await colRef.get();

  console.log(`Found ${snapshot.size} collaborators to update.`);

  let count = 0;
  for (const doc of snapshot.docs) {
    await doc.ref.update({ mustChangePassword: false });
    count++;
    if (count % 10 === 0) console.log(`Updated ${count} collaborators...`);
  }

  console.log(`Successfully updated ${count} collaborators.`);
}

run().catch(console.error);
