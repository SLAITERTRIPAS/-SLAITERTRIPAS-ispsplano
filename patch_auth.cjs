const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf-8');

const regex = /export const canAccessArea = \([\s\S]*?\)\s*=>\s*\{[\s\S]*?return true;\n\};/g;

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

  const tDir = (targetDir || "").toLowerCase().trim();
  const tDept = (targetDept || "").toLowerCase().trim();
  const tSector = (targetSector || "").toLowerCase().trim();

  // Diretores Centrais -> acessam Direções
  if (combinedRole.includes("diretor") || combinedRole.includes("director")) {
    if (uDir && tDir && (tDir.includes(uDir) || uDir.includes(tDir))) return true;
  }

  // Chefe de Departamento -> acessam Departamentos
  if (combinedRole.includes("chefe de departamento") || combinedRole.includes("departamento")) {
    if (uDept && tDept && (tDept.includes(uDept) || uDept.includes(tDept))) return true;
  }

  // Chefe de Reparticao -> acessam Reparticoes
  if (combinedRole.includes("chefe de repartição") || combinedRole.includes("chefe de reparticao") || combinedRole.includes("reparticao")) {
    if (uSector && tSector && (tSector.includes(uSector) || uSector.includes(tSector))) return true;
  }

  // Fallback para quem tem apenas a area preenchida
  if (uSector && tSector && tSector === uSector) return true;
  if (uDept && tDept && tDept === uDept) return true;
  if (uDir && tDir && tDir === uDir) return true;

  // Check if they are just part of the department/sector
  if (uSector && tSector.includes(uSector)) return true;
  if (uDept && tDept.includes(uDept)) return true;
  if (uDir && tDir.includes(uDir)) return true;

  return false;
};`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
