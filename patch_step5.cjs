const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/ActivityForm.tsx",
  "utf8",
);

const regex =
  /case 5:[\s\S]*?if \(isNaN\(start\.getTime\(\)\)\) \{ setError\('Data de início inválida'\); return false; \}/;

const replacement = `case 5:
        if (formData.frequencia !== 'Pontual' && (!formData.trimestres || formData.trimestres.length === 0)) { 
          setError('Selecione pelo menos um trimestre para atividades repetidas'); 
          return false; 
        }
        if (!formData.mesesRealizacao || formData.mesesRealizacao.length === 0) { 
          setError('Selecione pelo menos um mês de realização'); 
          return false; 
        }
        if (!formData.frequencia) { setError('Selecione a frequência'); return false; }
        if (!formData.dataInicio) { setError('Selecione a data de início'); return false; }
        
        const start = new Date(formData.dataInicio);
        if (isNaN(start.getTime())) { setError('Data de início inválida'); return false; }`;

content = content.replace(regex, replacement);
fs.writeFileSync("src/blocos/bloco5_sistema/ActivityForm.tsx", content);
console.log("Patched validation.");
