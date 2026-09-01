const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/PlanoWorkflowView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const regex = /referencia: \(\(\) => \{[\s\S]*?return \`\$\{department\}\/\$\{initials\}\/DF\/P\/\$\{nextNumber\}\`;\n\s*\}\)\(\),/;

const replacement = `referencia: (() => {
                          if (data.codigoAtividade)
                            return data.codigoAtividade.toUpperCase();
                          if (!data._forceNewRecord && editingActivity?.referencia)
                            return editingActivity.referencia;
                          
                          const specificArea = 
                            data.setor || 
                            data.reparticao || 
                            data.departamento || 
                            data.direcao || 
                            data.selectedCategory || 
                            "ISPS";

                          const areaActivities = rawActivities.filter(
                            (a: any) => {
                              const actArea = \`\${a.direcao} \${a.departamento} \${a.reparticao} \${a.setor}\`.toLowerCase();
                              return actArea.includes(specificArea.toLowerCase()) && 
                                (a.ano || new Date().getFullYear()) === selectedYear;
                            }
                          );

                          const maxNumber = areaActivities.reduce(
                            (max: number, a: any) => {
                              const ref = String(a.referencia || "");
                              const match = ref.match(/\\/DF\\/P\\/(\\d+)$/);
                              const num = match ? parseInt(match[1], 10) : 0;
                              return num > max ? num : max;
                            },
                            0,
                          );

                          const nextNumber = String(maxNumber + 1).padStart(
                            3,
                            "0",
                          );

                          const activityTitle =
                            data.nomeAtividade ||
                            data.title ||
                            "Nova Atividade";
                          const initials = activityTitle
                            .substring(0, 4)
                            .toUpperCase();
                            
                          const depAbbrev = specificArea.substring(0, 15).trim().toUpperCase();
                          return \`\${depAbbrev}/\${initials}/DF/P/\${nextNumber}\`;
                        })(),`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
