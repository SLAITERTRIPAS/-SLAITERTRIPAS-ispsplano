const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

const replacementButtons = `                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedLevel("direcao");
                        setSelectedUnit(userDirecao);
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "direcao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      🏢 Por Direção: {userDirecao}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLevel("departamento");
                        setSelectedUnit(userDepartamento);
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "departamento"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📂 Por Departamento: {userDepartamento}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLevel("setor");
                        setSelectedUnit("todos");
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "setor"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📌 Por Setor do Departamento
                    </button>
                  </>
                )}`;

code = code.replace(/                \) : \([\s\S]*?                  \<\/button\>\n                  \<\/>\n                \)}/g, replacementButtons + "\n                )}");

fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
console.log("Regex patch applied");
