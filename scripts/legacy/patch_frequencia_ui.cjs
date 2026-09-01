const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

const regexTrimestres =
  /<div>\s*<label className="block text-\[10px\] font-black text-blue-900 mb-2 uppercase tracking-widest">Trimestres de Execução \(Selecione até 4\)<\/label>[\s\S]*?<div className="grid grid-cols-2 md:grid-cols-4 gap-2">[\s\S]*?<\/div>\s*<\/div>/;

const matched = content.match(regexTrimestres);
if (matched) {
  const replacement = `
                {formData.frequencia !== 'Pontual' && (
                  <div>
                    <label className="block text-[10px] font-black text-blue-900 mb-2 uppercase tracking-widest">Trimestres de Execução (Selecione até 4)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {TRIMESTRES.map(t => (
                        <label key={t} className={\`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all \${formData.trimestres?.includes(t) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 hover:border-blue-300'}\`}>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={formData.trimestres?.includes(t)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              let newTrims = [...(formData.trimestres || [])];
                              if (checked) {
                                if (newTrims.length < 4) newTrims.push(t);
                              } else {
                                newTrims = newTrims.filter(item => item !== t);
                              }
                              setFormData({ ...formData, trimestres: newTrims });
                            }}
                          />
                          <span className="text-xs font-bold">{t} de {nextYear}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
  `;
  content = content.replace(regexTrimestres, replacement);
  fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
  console.log("Patched hide trimestres.");
}
