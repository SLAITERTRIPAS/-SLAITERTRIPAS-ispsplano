const fs = require('fs');
const file = 'src/blocos/bloco6_documentos/InformacaoPropostaForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `              {/* Transporte */}
              <div className="p-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sky-500">3. Repartição de Transporte</span>
                  <div className="border-b border-green-800 mt-1"></div>
                </div>
                <div className="text-center mt-8">
                  <div className="border-b border-slate-300 w-full mb-1"></div>
                  <span className="text-sky-500 font-bold">Chefe de Transporte</span>
                </div>
              </div>`;

const replaceStr = `              {/* Transporte */}
              <div className="p-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sky-500">3. Repartição de Transporte</span>
                  <div className="border-b border-teal-700 mt-1"></div>
                </div>
                <div className="text-center mt-8">
                  <div className="border-b border-slate-300 w-full mb-1"></div>
                  <span className="text-sky-500 font-bold">Chefe de Transporte</span>
                </div>
              </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Target string not found");
}
