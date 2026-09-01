const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

const targetButtons = `                ) : (
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
                  </>
                )}`;

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

if (code.includes(targetButtons)) {
  code = code.replace(targetButtons, replacementButtons);
  console.log("Replaced buttons");
} else {
  console.log("Could not find targetButtons");
}

const targetSelect = `              {/* Seletor da Unidade Conforme o Nível Escolhido */}
              {selectedLevel !== "institucional" && (isPlanificacaoOrDPEP || selectedLevel === "departamento" || (DEPARTAMENTOS[userDirecao] || []).length > 1) && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    {selectedLevel === "direcao" ? "Por Direção:" : "Departamento:"}
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full md:w-64 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer shadow-xs"
                  >
                    {isPlanificacaoOrDPEP && (
                      <option value="todos">
                        {selectedLevel === "direcao" ? "Todas as Direções" : \`Todas as Unidades (\${selectedLevel.toUpperCase()})\`}
                      </option>
                    )}
                    {isPlanificacaoOrDPEP ? (
                      (levelUnits[selectedLevel] || []).map((unit, idx) => (
                        <option key={idx} value={unit}>
                          {unit}
                        </option>
                      ))
                    ) : selectedLevel === "direcao" ? (
                      <option value={userDirecao}>{userDirecao}</option>
                    ) : (
                      <>
                        <option value={userDepartamento}>{userDepartamento}</option>
                        {DEPARTAMENTOS[userDirecao]?.map((dep, idx) => (
                          <option key={idx} value={dep}>{dep}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              )}`;

const replacementSelect = `              {/* Seletor da Unidade Conforme o Nível Escolhido */}
              {selectedLevel !== "institucional" && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    {selectedLevel === "direcao" ? "Por Direção:" : selectedLevel === "setor" ? "Setor:" : "Departamento:"}
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full md:w-64 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer shadow-xs"
                  >
                    {isPlanificacaoOrDPEP && (
                      <option value="todos">
                        {selectedLevel === "direcao" ? "Todas as Direções" : \`Todas as Unidades (\${selectedLevel.toUpperCase()})\`}
                      </option>
                    )}
                    {isPlanificacaoOrDPEP ? (
                      (levelUnits[selectedLevel] || []).map((unit, idx) => (
                        <option key={idx} value={unit}>
                          {unit}
                        </option>
                      ))
                    ) : selectedLevel === "direcao" ? (
                      <option value={userDirecao}>{userDirecao}</option>
                    ) : selectedLevel === "setor" ? (
                      <>
                        <option value="todos">Todos os Setores do Departamento</option>
                        {getSetoresByDepartamento(userDepartamento).map((setor, idx) => (
                           <option key={idx} value={setor}>{setor}</option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option value={userDepartamento}>{userDepartamento}</option>
                        {(() => {
                           const roleStr = String(user?.cargo || user?.title || user?.role || user?.cargoChefia || "").toLowerCase();
                           const isDirector = roleStr.includes("diretor") || roleStr.includes("director");
                           if (isDirector) {
                             return DEPARTAMENTOS[userDirecao]?.filter(d => d !== userDepartamento).map((dep, idx) => (
                               <option key={idx} value={dep}>{dep}</option>
                             ));
                           }
                           return null;
                        })()}
                      </>
                    )}
                  </select>
                </div>
              )}`;

if (code.includes(targetSelect)) {
  code = code.replace(targetSelect, replacementSelect);
  console.log("Replaced select");
} else {
  console.log("Could not find targetSelect");
}

fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
