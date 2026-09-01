const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "ai-studio-remixsigepispsfi-568cf7ab-1c6a-4f17-a452-343b45e6e59f"
  });
}

const db = admin.firestore();

async function checkRH() {
  console.log("A verificar atividades e matrizes associadas a Recursos Humanos...");
  
  const collections = ["actividades", "matrix_activities", "atividades_planeamento", "planos"];
  
  for (const colName of collections) {
    const snap = await db.collection(colName).get();
    console.log(`\nColeção: ${colName} (Total docs: ${snap.size})`);
    
    snap.forEach(doc => {
      const data = doc.data();
      const strData = JSON.stringify(data).toLowerCase();
      if (
        strData.includes("recursos humanos") ||
        strData.includes("recursos_humanos") ||
        strData.includes("rh") ||
        strData.includes("drh")
      ) {
        console.log(`- Doc ID: ${doc.id}`);
        console.log(`  Codigo: ${data.codigoAtividade || data.referencia || data.numeroAtividade || "N/A"}`);
        console.log(`  Departamento: ${data.departamento || data.targetDept || "N/A"}`);
        console.log(`  Setor: ${data.setor || data.targetSector || "N/A"}`);
        console.log(`  Valor: ${data.valorTotal || data.valor || data.orcamentoTotal || 0}`);
      }
    });
  }
}

checkRH().catch(console.error);
