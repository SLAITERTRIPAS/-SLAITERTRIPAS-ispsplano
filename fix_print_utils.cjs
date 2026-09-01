const fs = require('fs');
let content = fs.readFileSync('src/lib/printUtils.ts', 'utf8');

// 1. In sanitizeHtmlForPrinting, add `.print\\:hidden` to the query selector
content = content.replace(
  '".no-print, [title*=\'Editar\']"',
  '".no-print, .print\\\\:hidden, [title*=\'Editar\']"'
);
content = content.replace(
  '"button, input[type=\'checkbox\'], input[type=\'radio\'], select, .no-print, [title*=\'Editar\'], [title*=\'Eliminar\'], [title*=\'Visualizar\'], [title*=\'Clique para selecionar\']"',
  '"button, input[type=\'checkbox\'], input[type=\'radio\'], select, .no-print, .print\\\\:hidden, [title*=\'Editar\'], [title*=\'Eliminar\'], [title*=\'Visualizar\'], [title*=\'Clique para selecionar\']"'
);

// 2. Add class cleanup for dark mode and extra styles
const classCleanup = `
    // Limpar estilos de dark mode que atrapalham a impressão de documentos
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      let cls = el.getAttribute('class');
      if (cls) {
        // Remover classes de background dark, text-slate-100, etc.
        cls = cls.replace(/bg-slate-[89]00\\/?\\d*/g, 'bg-white');
        cls = cls.replace(/bg-[#\\w]+\\/?\\d*/g, 'bg-white');
        cls = cls.replace(/text-slate-[123]00/g, 'text-slate-900');
        cls = cls.replace(/text-white/g, 'text-slate-900');
        cls = cls.replace(/border-slate-[789]00\\/?\\d*/g, 'border-slate-300');
        cls = cls.replace(/bg-transparent/g, 'bg-white');
        el.setAttribute('class', cls);
      }
    });
`;
content = content.replace('const toRemove =', classCleanup + '\n    const toRemove =');

fs.writeFileSync('src/lib/printUtils.ts', content);
