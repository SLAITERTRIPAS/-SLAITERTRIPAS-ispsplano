const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

const regex3 =
  /\{rubrica\.necessidade\?\.toLowerCase\(\)\.includes\('motorista'\) && formData\.realizacaoDistrito === 'Aeroporto de Chingodzi' \? 'Ajudas de Custo \(2x 30\%\)' : '30\% de Ajudas de Custos'\}/;
const replacement3 = `{'30% de Ajudas de Custos'}`;
content = content.replace(regex3, replacement3);

const regex4 =
  /if \(isMotorista\) \{\s*if \(formData\.realizacaoDistrito === 'Aeroporto de Chingodzi'\) \{[\s\S]*?\} else if \(\(formData\.totalDias \|\| 1\) <= 1\) \{[\s\S]*?\} else \{[\s\S]*?\}\s*\}/;
const replacement4 = `if (isMotorista) {
                                  return (0.3 * valorDiario * (rubrica.quantidade || 0)).toLocaleString('pt-MZ') + ' MZN';
                                }`;
content = content.replace(regex4, replacement4);

const regex5 =
  /\{rubrica\.necessidade\?\.toLowerCase\(\)\.includes\('motorista'\) \? \([\s\S]*?\} \: \(/;
const replacement5 = `{rubrica.necessidade?.toLowerCase().includes('motorista') ? (
                            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2">
                              <Info size={14} className="text-blue-500 shrink-0" />
                              <span className="text-[10px] text-blue-900 font-bold leading-tight">
                                Fórmula Motorista (Ida e Volta): {formData.totalDias || 1} viajem(s) × (30% de {valorDiario.toLocaleString('pt-MZ')}MT × {rubrica.quantidade || 1}p) = {rubrica.valorTotal?.toLocaleString('pt-MZ')} MZN
                              </span>
                            </div>
                          ) : (`;
content = content.replace(regex5, replacement5);

fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched 3, 4, 5.");
