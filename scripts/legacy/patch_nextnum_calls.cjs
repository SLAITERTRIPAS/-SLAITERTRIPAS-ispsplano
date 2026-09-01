const fs = require('fs');
const file = 'src/blocos/bloco5_sistema/ActivityForm.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Add import
if (!code.includes('getUserWorkspace')) {
  code = code.replace(/import \{.*?\} from "\.\.\/\.\.\/lib\/utils";/, match => 
    match + '\nimport { getUserWorkspace } from "../../lib/auth";'
  );
}

code = code.replace(/calculateNextNum\(plannedActivitiesProp\)/, 
  'calculateNextNum(plannedActivitiesProp, user ? getUserWorkspace(user) : formData?.departamento)'
);

code = code.replace(/calculateNextNum\(plannedActivitiesProp, formData\.departamento\)/g, 
  'calculateNextNum(plannedActivitiesProp, user ? getUserWorkspace(user) : formData.departamento)'
);

fs.writeFileSync(file, code);
