const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/ActivityForm.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Remove the existing Detalhes and Especificacao blocks from isBensServicos
const blockToRemoveRegex = /\{\/\* Detalhes \*\/\}[\s\S]*?\{\/\* Especificação \*\/\}[\s\S]*?<\/textarea>\s*<\/div>/;
code = code.replace(blockToRemoveRegex, '');

// 2. Add them globally at the bottom of the rubrica container.
// The container ends around `{isCombustivel && ( ... )}` and then `</div>` before the remove button.
const targetAnchor = `                        </div>
                      )}
                    </div>
                    {formData.rubricas.length > 1 && !isCombustivel && (`;

const newFields = `                        </div>
                      )}
                      
                      {/* Common fields for all rubricas: Especificação and Detalhes */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-900/10">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-blue-900 tracking-tight leading-tight ml-2">
                            Detalhes / Unidade da Necessidade
                          </label>
                          <input
                            type="text"
                            value={rubrica.detalhes || ""}
                            disabled={isBlocked}
                            onChange={(e) => {
                              const newRubricas = [...formData.rubricas];
                              newRubricas[index] = {
                                ...rubrica,
                                detalhes: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                rubricas: newRubricas,
                              });
                            }}
                            placeholder="Ex: Mês, Unidade, Caixa, Reunião, Deslocação..."
                            className="w-full px-4 py-2.5 border border-blue-900/20 rounded-xl text-[13px] font-bold text-gray-700 outline-none focus:border-blue-900 transition-all shadow-sm bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-blue-900 tracking-tight leading-tight ml-2">
                            Descrição / Especificação da Necessidade
                          </label>
                          <textarea
                            value={rubrica.especificacao || ""}
                            disabled={isBlocked}
                            onChange={(e) => {
                              const newRubricas = [...formData.rubricas];
                              newRubricas[index] = {
                                ...rubrica,
                                especificacao: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                rubricas: newRubricas,
                              });
                            }}
                            placeholder="Descreva detalhadamente o serviço ou necessidade..."
                            className="w-full p-4 border border-blue-900/20 rounded-xl text-[13px] font-bold text-gray-700 outline-none focus:border-blue-900 transition-all resize-none shadow-sm bg-white min-h-[50px] h-full"
                          />
                        </div>
                      </div>
                    </div>
                    {formData.rubricas.length > 1 && !isCombustivel && (`;

code = code.replace(targetAnchor, newFields);
fs.writeFileSync(file, code);
