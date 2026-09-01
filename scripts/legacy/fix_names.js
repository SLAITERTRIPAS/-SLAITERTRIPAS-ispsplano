const fs = require('fs');

const files = [
  'src/components/AcaoOrcamentalView.tsx',
  'src/blocos/bloco5_sistema/PlanoWorkflowView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace fallback strings
  content = content.replace(/"Geral \/ Não Especificado"/g, '""');
  content = content.replace(/\|\| "Geral"/g, '|| ""');
  content = content.replace(/\|\| "Departamento Geral"/g, '|| ""');
  content = content.replace(/\|\| "Repartição Geral"/g, '|| ""');
  content = content.replace(/\|\| "Direção Geral"/g, '|| ""');
  content = content.replace(/\|\| "Setor Geral"/g, '|| ""');
  content = content.replace(/\|\| "Necessidade Geral"/g, '|| ""');
  content = content.replace(/\|\| "Diversos \/ Geral"/g, '|| ""');
  content = content.replace(/\|\| "Outras Despesas \/ Geral"/g, '|| ""');
  content = content.replace(/\|\| "Setor\/Repartição Geral"/g, '|| ""');
  content = content.replace(/"Setor\/Repartição Geral"/g, '""');
  content = content.replace(/"Departamento Geral"/g, '""');
  content = content.replace(/"Repartição Geral"/g, '""');
  
  // Special labels
  content = content.replace(/"OE \(Geral\)"/g, '"OE"');
  content = content.replace(/"Institucional \(Geral\)"/g, '"Institucional"');
  content = content.replace(/"Todos \(Geral\)"/g, '"Todos"');
  content = content.replace(/"Todas as Áreas \(Geral\)"/g, '"Todas as Áreas"');
  
  fs.writeFileSync(file, content);
});
