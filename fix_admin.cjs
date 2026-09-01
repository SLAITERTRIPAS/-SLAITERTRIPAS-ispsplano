const fs = require("fs");
let code = fs.readFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  "utf8",
);

// Remove c.nuit === '108164611' from isSystemAdmin
code = code.replace(/ \|\| c\.nuit === '108164611'/g, "");

// Also add a check to hide SystemAdmin from filteredList
// We find:
//      const isSystemAdmin = c.cargoChefia === 'Proprietário do sistema' ||
//                            c.cargoChefia === 'Administrador de sistema' ||
//                            c.categoria?.toLowerCase().includes('proprietario') ||
//                           c.id === 'FTV108164611';
// And we add: if (isSystemAdmin) return false;
// And remove the "Um Só Franziss" logic completely because now the admin is hidden and the regular one is shown!

// First, let's remove the "Um Só Franziss" logic:
const franzissLogic = `      // Lógica "Um Só Franziss": 
      // Se houver múltiplos registos para Franziss (admin e colaborador), manter apenas o principal (admin) na lista geral
      if (isFranziss && !isSystemAdmin) { 
         // Verificar se existe um admin Franziss na lista
         const hasAdminFranziss = colaboradores.some(col => 
             (col.nome?.toLowerCase().includes("franzissi") || col.nome?.toLowerCase().includes("franzíssi")) && 
             (col.cargoChefia === 'Proprietário do sistema' || col.id === 'FTV108164611') 
         );
         if (hasAdminFranziss) return false; // Remove duplicados do Franziss
      }`;
code = code.replace(
  franzissLogic,
  "      // Admin is hidden from the general list\n      if (isSystemAdmin) return false;",
);

fs.writeFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  code,
);
