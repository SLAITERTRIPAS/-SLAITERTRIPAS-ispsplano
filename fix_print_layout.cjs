const fs = require('fs');
let content = fs.readFileSync('src/lib/printUtils.ts', 'utf8');

// Ensure that .print\\:hidden is strictly respected
if (!content.includes('display: none !important')) {
  content = content.replace(
    '          html, body {',
    `          .print\\\\:hidden, .no-print { display: none !important; }
          html, body {`
  );
}

fs.writeFileSync('src/lib/printUtils.ts', content);
