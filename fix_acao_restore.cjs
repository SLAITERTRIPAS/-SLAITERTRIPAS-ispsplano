const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

const regex = /                  \{!isEditingTeto \? \([\s\S]*?                  \<\/button\>\n                  \<\/>\n                \)\}/g;

const restoreText = `                  {!isEditingTeto ? (
                    <button
                      onClick={() => {
                        setTempTetoInput(String(tetoMax));
                        setIsEditingTeto(true);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors shadow-sm"
                    >
                      Inserir / Alterar Teto Atribuído
                    </button>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <input
                        type="number"
                        value={tempTetoInput}
                        onChange={(e) => setTempTetoInput(e.target.value)}
                        className="w-full text-xs font-black text-slate-800 p-2.5 bg-slate-50 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Insira o valor limite..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTeto}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] py-2 rounded-lg transition-colors uppercase tracking-widest"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setIsEditingTeto(false)}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] py-2 rounded-lg transition-colors uppercase tracking-widest"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NOVO: Gráfico de Barras de Distribuição por Rúbricas */}
            {sectorActivities.length > 0 && parentRubricasBreakdown.length > 0 && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="text-xs font-black text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <PieChart size={14} className="text-blue-600" />
                  Distribuição por Rúbrica Pai
                </h4>
                <div className="space-y-4">
                  {parentRubricasBreakdown.map((rub: any, idx: number) => {
                    const percent = tetoMax > 0 ? (rub.totalValor / tetoMax) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-600 truncate mr-2">{rub.rubrica.substring(0, 30)}...</span>
                          <span className="text-blue-700">{formatCurrency(rub.totalValor)} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ width: \`\${Math.min(percent, 100)}%\` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30">
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                {isPlanificacaoOrDPEP ? (
                  <>
                    <button
                      onClick={() => handleLevelChange("institucional")}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "institucional"
                          ? "bg-slate-900 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      🏛️ Institucional (Geral)
                    </button>
                    <button
                      onClick={() => handleLevelChange("direcao")}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "direcao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      🏢 Por Direção
                    </button>
                    <button
                      onClick={() => handleLevelChange("departamento")}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "departamento"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📂 Por Departamento
                    </button>
                    <button
                      onClick={() => handleLevelChange("reparticao")}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "reparticao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📍 Por Repartição
                    </button>
                    <button
                      onClick={() => handleLevelChange("setor")}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "setor"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📌 Por Setor
                    </button>
                  </>
                ) : (
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

code = code.replace(regex, restoreText);
fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
console.log("Restored deleted code");
