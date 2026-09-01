const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

// We will insert frequencia before the Trimestres section
const freqHtml = `
              <div className="mb-6">
                <label className="block text-[10px] font-black text-blue-900 mb-2 uppercase tracking-widest">Frequência da Atividade</label>
                <select
                  value={formData.frequencia}
                  onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })}
                  className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Pontual">Pontual</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Diária">Diária</option>
                </select>
              </div>
`;

content = content.replace(
  /<h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">V\. TEMPO E DURAÇÃO<\/h4>(\s*)<div className="grid grid-cols-1 md:grid-cols-1 gap-6">/g,
  `<h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">V. TEMPO E DURAÇÃO</h4>$1${freqHtml}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">`,
);

// Disable the old select
content = content.replace(
  /className="ml-2 inline-block p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"/,
  'className="ml-2 inline-block p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" disabled',
);

fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched frequencia.");
