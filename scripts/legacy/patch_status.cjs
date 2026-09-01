const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/PlanoWorkflowView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const regex = /status:\n\s*\(data\._forceNewRecord \? undefined : editingActivity\?\.status\) \|\|\n\s*\(selectedRoleMode === "Departamento"\n\s*\? "departamento"\n\s*: selectedRoleMode === "Direção"\n\s*\? "direcao"\n\s*: "setorial"\),/;

const replacement = `status:
                          (data._forceNewRecord ? undefined : editingActivity?.status) ||
                          (selectedRoleMode === "Planificação"
                            ? "planificacao"
                            : selectedRoleMode === "Direção"
                              ? "direcao"
                              : selectedRoleMode === "Departamento"
                                ? "departamento"
                                : selectedRoleMode === "Repartição"
                                  ? "reparticao"
                                  : "setorial"),`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
