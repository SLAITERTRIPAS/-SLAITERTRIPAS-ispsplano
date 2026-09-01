const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf-8');

const regex = /export const canAccessArea = \([\s\S]*?\)\s*=>\s*\{[\s\S]*?return false;\n\};/g;

const replacement = `export const canAccessArea = (
  user: any,
  targetDir: string,
  targetDept: string,
  targetSector: string,
) => {
  if (!user) return false;
  
  // Super Boss, Admin, etc can see everything
  const role = (user.role || "").toLowerCase();
  const title = (user.title || user.cargo || user.cargoChefia || "").toLowerCase();
  const combinedRole = role + " " + title;
  
  if (
    combinedRole.includes("admin") ||
    combinedRole.includes("proprietario") ||
    combinedRole.includes("diretor geral") ||
    combinedRole.includes("director geral") ||
    combinedRole.includes("diretor-geral") ||
    user.email === "admin@isps.ac.mz"
  ) {
    return true;
  }

  const uDir = (user.direcao || "").toLowerCase().trim();
  const uDept = (user.departamento || "").toLowerCase().trim();
  const uSector = (user.setor || user.reparticao || "").toLowerCase().trim();
  
  // Create a combined list of all user areas to ensure we don't miss a match if data is stored in the wrong field
  const userAreas = [uDir, uDept, uSector].filter(Boolean);

  const tDir = (targetDir || "").toLowerCase().trim();
  const tDept = (targetDept || "").toLowerCase().trim();
  const tSector = (targetSector || "").toLowerCase().trim();

  // Diretores Centrais -> acessam Direções
  if (combinedRole.includes("diretor") || combinedRole.includes("director")) {
    if (tDir && userAreas.some(area => tDir.includes(area) || area.includes(tDir))) return true;
  }

  // Chefe de Departamento -> acessam Departamentos
  if (combinedRole.includes("chefe de departamento") || combinedRole.includes("departamento")) {
    if (tDept && userAreas.some(area => tDept.includes(area) || area.includes(tDept))) return true;
    // Fallback in case the activity was saved with the department name in the setor field
    if (tSector && userAreas.some(area => tSector.includes(area) || area.includes(tSector))) return true;
  }

  // Chefe de Reparticao -> acessam Reparticoes
  if (combinedRole.includes("chefe de repartição") || combinedRole.includes("chefe de reparticao") || combinedRole.includes("reparticao") || combinedRole.includes("repartição")) {
    if (tSector && userAreas.some(area => tSector.includes(area) || area.includes(tSector))) return true;
  }

  // Fallback genérico de correspondência exata para a área do utilizador
  if (uSector && tSector && tSector === uSector) return true;
  if (uDept && tDept && tDept === uDept) return true;
  if (uDir && tDir && tDir === uDir) return true;

  // Partial match
  if (uSector && tSector.includes(uSector)) return true;
  if (uDept && tDept.includes(uDept)) return true;
  if (uDir && tDir.includes(uDir)) return true;

  return false;
};`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
