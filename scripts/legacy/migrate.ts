
import { databaseMaintenance } from "./src/lib/databaseMaintenance";
import { db } from "./src/lib/firebase";

async function runMigration() {
  console.log("Starting migration...");
  await databaseMaintenance.migrateActivitiesToSubmitted();
  console.log("Migration finished.");
}

runMigration().catch(console.error);
