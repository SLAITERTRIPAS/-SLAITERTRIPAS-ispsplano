const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf-8');

const regex = /return activities\.filter\(\(a\) => \{([\s\S]*?)return canAccessArea\(user, aDir, aDept, aSector\);\n\s*\}\);/;

const replacement = `return activities.filter((a) => {
$1
    const activityLevel = getActivityStatusLevel(a.status);
    const requiredLevel = getUserRequiredStatusLevel(user);
    
    // Only allow access if the activity has reached the status required by the user's hierarchy level
    if (activityLevel < requiredLevel) return false;

    return canAccessArea(user, aDir, aDept, aSector);
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
