const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/ActivityForm.tsx';
let code = fs.readFileSync(file, 'utf-8');

if (!code.includes('getUserWorkspace')) {
  code = code.replace(/import \{.*\} from "\.\.\/\.\.\/lib\/utils";/g, match => 
    match + '\nimport { getUserWorkspace } from "../../lib/auth";'
  );
  fs.writeFileSync(file, code);
}
