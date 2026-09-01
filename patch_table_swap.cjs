const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/PlanoWorkflowView.tsx",
  "utf8",
);

const regexOrgaoCell =
  /<td className="p-2 border-r border-slate-300 text-\[10px\] text-slate-600 font-semibold text-center whitespace-nowrap" title=\{activity\.unidadeOrganica \|\| activity\.unidadeSelecionada \|\| "ISPS"\}\>\s*\{activity\.unidadeOrganica \|\| activity\.unidadeSelecionada \|\| "ISPS"\}\s*<\/td>/;

const regexDirecaoCell =
  /<td className="p-2 border-r border-slate-300 text-\[10px\] font-bold text-slate-800" title=\{activity\.direcao \|\| "Geral"\}\>\s*\{activity\.direcao \? getDirectionAbbreviation\(activity\.direcao\) : "-"\}\s*<\/td>/;

const replacementOrgao = `<td className="p-2 border-r border-slate-300 text-[10px] text-slate-600 font-semibold text-center whitespace-nowrap" title={activity.unidadeOrganica || activity.unidadeSelecionada || "ISPS"}>
              {(() => {
                let orgao = activity.unidadeOrganica || activity.unidadeSelecionada || "ISPS";
                let dir = activity.direcao || "Geral";
                if (orgao.includes("Diretor-Geral") && dir.includes("Direção e Gestão")) {
                  orgao = dir;
                }
                return getDirectionAbbreviation(orgao);
              })()}
            </td>`;

const replacementDirecao = `<td className="p-2 border-r border-slate-300 text-[10px] font-bold text-slate-800" title={activity.direcao || "Geral"}>
              {(() => {
                let orgao = activity.unidadeOrganica || activity.unidadeSelecionada || "ISPS";
                let dir = activity.direcao || "Geral";
                if (orgao.includes("Diretor-Geral") && dir.includes("Direção e Gestão")) {
                  dir = orgao;
                }
                return getDirectionAbbreviation(dir);
              })()}
            </td>`;

content = content.replace(regexOrgaoCell, replacementOrgao);
content = content.replace(regexDirecaoCell, replacementDirecao);

fs.writeFileSync("src/blocos/bloco5_sistema/PlanoWorkflowView.tsx", content);
console.log("Patched table swap.");
