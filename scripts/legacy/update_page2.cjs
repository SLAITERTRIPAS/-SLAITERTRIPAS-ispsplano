const fs = require('fs');
const file = 'src/blocos/bloco6_documentos/InformacaoPropostaForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            {/* Nota de Viagem (N.B) */}
            <div className="border-l-4 border-slate-900 pl-3 py-1 font-serif text-[10px] font-bold text-slate-700 italic my-6">
              N.B: {formData.notaViagem}
            </div>`;

const replaceStr = `            {/* Secção de Vistos / Assinaturas Adicionais */}
            <div className="grid grid-cols-3 border border-slate-950 min-h-[120px] mt-8 mb-4 font-serif text-[11px] text-slate-900">
              {/* Secretaria Geral */}
              <div className="border-r border-slate-950 p-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900">1. Secretaria geral</span>
                  <div className="border-b border-blue-900 mt-1"></div>
                </div>
                <div className="text-center mt-8">
                  <div className="border-b border-slate-300 w-full mb-1"></div>
                </div>
              </div>
              
              {/* DAF */}
              <div className="border-r border-slate-950 p-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-green-600">2. Departamento de Apoio Financeiro</span>
                  <div className="border-b border-green-600 mt-1"></div>
                </div>
                <div className="text-center mt-8">
                  <div className="border-b border-slate-300 w-full mb-1"></div>
                  <span className="text-sky-500 font-bold">chefe da DAF</span>
                </div>
              </div>

              {/* Transporte */}
              <div className="p-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sky-500">3. Repartição de Transporte</span>
                  <div className="border-b border-green-800 mt-1"></div>
                </div>
                <div className="text-center mt-8">
                  <div className="border-b border-slate-300 w-full mb-1"></div>
                  <span className="text-sky-500 font-bold">Chefe de Transporte</span>
                </div>
              </div>
            </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Target string not found");
}
